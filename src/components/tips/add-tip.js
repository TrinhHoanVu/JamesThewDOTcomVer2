import React, { useState, useEffect, useRef, useContext } from "react";
import { Editor, EditorState } from "draft-js";
import "draft-js/dist/Draft.css";
import axios from "axios";
import Swal from 'sweetalert2';
import { DataContext } from "../../context/DatabaseContext";
import "../../css/tip/tip-add-edit.css";

function AddTip({ onClose, reloadTips, IsApproved, title = 'Add tip successfully!' }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState(() => EditorState.createEmpty());
    const [tipNameList, setTipNameList] = useState([]);
    const { tokenInfor } = useContext(DataContext);
    const [isPublic, setIsPublic] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentImage, setCurrentImage] = useState("/images/test.jpg");

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [admin, setAdmin] = useState([]);
    const [loadingPost, setLoadingPost] = useState(false);

    const editorRef = useRef();

    // ... Keep all the existing functions (fetchCurrentAdmin, handleImageChange, validate, handleSave, etc.)
    // [Previous functions remain unchanged]

    const focus = () => {
        try {
            editorRef.current.focus();
        } catch (er) { console.log(er) }
    };

    useEffect(() => {
        fetchCurrentAdmin();
        fetchContestNames();
    }, []);

    const fetchContestNames = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Tips/getAllTipNames");
            setTipNameList(response.data.$values);
        } catch (err) { console.log(err) }
    };

    const fetchCurrentAdmin = async () => {
        try {
            const respone = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
            setAdmin(respone.data);
        } catch (error) { console.log(error) }
        finally {
            setLoading(false);
        }
    };

    const handleImageChange = (event) => {
        try {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    Swal.fire({
                        icon: 'error',
                        title: 'File too large',
                        text: 'Please select an image under 5MB',
                    });
                    event.target.value = '';
                    return;
                }

                setSelectedImage(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        } catch (err) { console.log(err) }
    };

    const validate = () => {
        try {
            const errors = {};

            if (!name.trim()) {
                errors.name = "Name is required.";
            } else if (tipNameList.includes(name)) {
                errors.name = "This name is already taken.";
            }

            if (!description.getCurrentContent().hasText()) {
                errors.description = "Description is required.";
            }

            if (!selectedImage) {
                errors.image = "Image is required.";
            } else if (selectedImage.size > 5 * 1024 * 1024) {
                errors.image = "Image size must be under 5MB.";
            }

            setErrors(errors);
            return errors;
        } catch (error) {
            console.log(error)
        }
    };


    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const validationErrors = validate();
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            const formData = new FormData();
            formData.append("Name", name);
            formData.append("Description", description.getCurrentContent().getPlainText());
            formData.append("IsPublic", isPublic);
            formData.append("IsApproved", IsApproved);
            formData.append("IdAccountPost", admin.idAccount);
            if (selectedImage) {
                formData.append("Image", selectedImage);
            }

            setLoadingPost(true);
            await axios.post("http://localhost:5231/api/Tips/addTip", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setLoadingPost(false);
            localStorage.setItem("managementTab", "tip");
            Swal.fire({
                icon: 'success',
                title: title,
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.reload();
            });

            if (reloadTips) {
                await reloadTips();
            }
            if (onClose) {
                onClose();
            }
        } catch (err) {
            setLoadingPost(false);
            Swal.fire({
                icon: 'error',
                title: 'Failed to add Tip',
                text: 'Please try again later.',
            });
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px",
            display: "flex",
            gap: "40px"
        }}>
            {/* Left Column - Form Fields */}
            <div style={{ flex: "1" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label>Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "8px",
                            marginTop: "5px",
                            border: "1px solid #ddd",
                            borderRadius: "4px"
                        }}
                    />
                    {errors.name && <span style={{ color: "red", fontSize: "14px" }}>{errors.name}</span>}
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label>Status:</label>
                    <select
                        value={isPublic ? "true" : "false"}
                        onChange={(e) => setIsPublic(e.target.value === "true")}
                        style={{
                            width: "100%",
                            padding: "8px",
                            marginTop: "5px",
                            border: "1px solid #ddd",
                            borderRadius: "4px"
                        }}
                    >
                        <option value="true">Public</option>
                        <option value="false">Private</option>
                    </select>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label>Description: {errors.description && <span style={{ color: "red", fontSize: "14px" }}>{errors.description}</span>}</label>
                    <div
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "10px",
                            marginTop: "5px",
                            minHeight: "200px",
                            backgroundColor: "#fff"
                        }}
                        onClick={focus}
                    >
                        <Editor
                            ref={editorRef}
                            editorState={description}
                            onChange={setDescription}
                        />
                    </div>
                </div>

                <div style={{ textAlign: "center" }}>
                    <button
                        onClick={handleSave}
                        disabled={loadingPost}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#ffc107",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: loadingPost ? "not-allowed" : "pointer",
                            opacity: loadingPost ? 0.7 : 1
                        }}
                    >
                        {loadingPost ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>

            {/* Right Column - Image Preview */}
            <div style={{ flex: "1" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label>Image:</label>
                    <div style={{ marginTop: "5px" }}>
                        <input
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                            style={{
                                width: "100%",
                                padding: "8px",
                                border: "1px solid #ddd",
                                borderRadius: "4px"
                            }}
                        />
                        {errors.image && <span style={{ color: "red", fontSize: "14px" }}>{errors.image}</span>}

                    </div>
                    <div style={{
                        marginTop: "20px",
                        minHeight: "400px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f8f9fa"
                    }}>
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "400px",
                                    objectFit: "contain"
                                }}
                            />
                        ) : (
                            <div style={{
                                textAlign: "center",
                                color: "#6c757d"
                            }}>
                                No image selected
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddTip;