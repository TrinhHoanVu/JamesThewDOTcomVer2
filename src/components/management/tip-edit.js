import React, { useState, useEffect, useRef } from "react";
import { Editor, EditorState, ContentState, convertFromRaw } from "draft-js";
import "draft-js/dist/Draft.css";
import axios from "axios";
import Swal from 'sweetalert2';
import "../../css/tip/tip-add-edit.css";
function TipEditForm({ idTip, onClose, reloadTips }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState(() => EditorState.createEmpty());
    const [isPublic, setIsPublic] = useState(true);
    const [currentImage, setCurrentImage] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingPost, setLoadingPost] = useState(false);

    const editorRef = useRef();

    const focus = () => {
        editorRef.current.focus();
    };

    const fetchTip = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Tips/detail/${idTip}`);
            const tip = response.data.contest;

            setName(tip.name);
            setIsPublic(tip.isPublic);
            setCurrentImage(`http://localhost:5231${tip.images}`);

            if (tip.decription) {
                try {
                    const contentState = convertFromRaw(JSON.parse(tip.decription));
                    setDescription(EditorState.createWithContent(contentState));
                } catch (e) {
                    const contentState = ContentState.createFromText(tip.decription);
                    setDescription(EditorState.createWithContent(contentState));
                }
            }
            setLoading(false);
        } catch (err) {
            setError("Failed to load tip details.");
            setLoading(false);
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const errors = {};
        if (!name.trim()) errors.name = "Name is required.";
        if (!description.getCurrentContent().hasText()) errors.description = "Description is required.";
        return errors;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description.getCurrentContent().getPlainText());
            formData.append("isPublic", isPublic.toString()); // Đảm bảo gửi đúng kiểu dữ liệu

            if (selectedImage) {
                formData.append("Image", selectedImage);
            }

            console.log("FormData:", Object.fromEntries(formData.entries())); // Log để kiểm tra dữ liệu gửi đi

            setLoadingPost(true);
            const response = await axios.put(
                `http://localhost:5231/api/Tips/update/${idTip}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            console.log("Response:", response);
            setLoadingPost(false);

            Swal.fire({
                icon: 'success',
                title: 'Tip updated successfully!',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.reload();
            });

            if (reloadTips) await reloadTips();
            if (onClose) onClose();
        } catch (err) {
            setLoadingPost(false);
            console.error("Error:", err.response ? err.response.data : err.message);
            Swal.fire({
                icon: 'error',
                title: 'Failed to update Tip',
                text: err.response?.data?.message || 'Please try again later.'
            });
        }
    };




    useEffect(() => { fetchTip(); }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="tip-edit-form-container">
            <div className="tip-edit-layout">
                {/* Left Column - Form */}
                <form className="tip-edit-form">
                    <div className="form-group">
                        <label className="form-label">Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="form-input"
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status:</label>
                        <select
                            value={isPublic ? "true" : "false"}
                            onChange={(e) => setIsPublic(e.target.value === "true")}
                            className="form-select"
                        >
                            <option value="true">Public</option>
                            <option value="false">Private</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description:</label>
                        <div className="editor-container"
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                                padding: "10px",
                                marginTop: "5px",
                                minHeight: "200px",
                                maxHeight: "200px",
                                backgroundColor: "#fff",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 8,
                                WebkitBoxOrient: "vertical",
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                            }}
                            onClick={focus}>
                            <Editor
                                ref={editorRef}
                                editorState={description}
                                onChange={setDescription}
                            />
                        </div>
                        {errors.description && (
                            <span className="error-message">{errors.description}</span>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="save-button"
                    >
                        Save
                    </button>

                    {loadingPost && (
                        <div className="loading-message">
                            Saving Tip, please wait...
                        </div>
                    )}
                </form>

                {/* Right Column - Image */}
                <div className="image-section">
                    {currentImage ? (
                        <img src={currentImage} alt="Tip" className="image-preview" />
                    ) : (
                        <div className="image-preview-placeholder">
                            No image selected
                        </div>
                    )}
                    <div className="file-input-container">
                        <input
                            type="file"
                            onChange={handleImageChange}
                            accept="image/*"
                            className="file-input"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TipEditForm;
