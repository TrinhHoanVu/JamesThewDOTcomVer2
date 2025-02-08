import React, { useState, useEffect, useRef, useContext } from "react";
import { Editor, EditorState, ContentState, convertFromRaw } from "draft-js";
import "draft-js/dist/Draft.css";
import axios from "axios";
import Swal from 'sweetalert2';
import { DataContext } from "../../context/DatabaseContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import IngredientCard from "../recipes/ingredient-card";


function ApplyEntry() {
    const { id } = useParams()
    const [name, setName] = useState("");
    const [description, setDescription] = useState(() => EditorState.createEmpty());
    const [isPublic, setIsPublic] = useState(true);
    const [initialIngredientList, setinItialIngredientList] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [ingredientList, setIngredientList] = useState([]);
    const [admin, setAdmin] = useState([]);
    const { tokenInfor } = useContext(DataContext);
    const [recipeNameList, setRecipeNameList] = useState([]);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingPost, setLoadingPost] = useState(false);

    const navigate = useNavigate()

    const editorRef = useRef();

    const focus = () => {
        try {
            editorRef.current.focus();
        } catch (er) { console.log(er) }
    };

    useEffect(() => {
        try {
            fetchIngredientList()
            fetchCurrentAdmin()
            fetchRecipeNames()
        } catch (err) { console.log(err) }
    }, []);


    const fetchRecipeNames = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Recipe/getAllRecipeNames")
            setRecipeNameList(response.data.$values)
        } catch (err) { console.log(err) }
    }

    const fetchIngredientList = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Recipe/getAllIngredient")
            const ingredientsWithQuantity = response.data.$values.map(item => ({
                ...item,
                quantity: 0,
            }));
            setIngredientList(ingredientsWithQuantity);
        } catch (err) { console.log(err) }
    }

    const fetchCurrentAdmin = async () => {
        try {
            const respone = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
            setAdmin(respone.data)
            console.log(admin)
        } catch (error) { console.log(error) }
        finally {
            setLoading(false);
        }
    }

    const validate = () => {
        const errors = {};
        try {
            if (!name.trim()) errors.name = "Name is required.";
            if (recipeNameList.includes(name.trim())) errors.name = "This name has already taken.";
            if (!description.getCurrentContent().hasText()) errors.description = "Description is required.";
            const missingQuantities = selectedIngredients.filter(item => !item.quantity || item.quantity <= 0);
            if (missingQuantities.length > 0) {
                errors.ingredients = `Please enter a quantity for: ${missingQuantities.map(item => item.name).join(", ")}`;
            }
        } catch (err) { console.log(err) }
        return errors;
    };

    const handleIngredientRemove = (ingredient) => {
        try {
            console.log(ingredientList)
            setSelectedIngredients(selectedIngredients.filter((item) => item.name !== ingredient));
        } catch (err) { console.log(err) }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            const validationErrors = validate();
            if (Object.keys(validationErrors).length > 0) {
                Swal.fire({ icon: "error", title: "Validation Error", text: Object.values(validationErrors).join("\n") });
                return;
            }

            Swal.fire({
                title: "Saving...",
                text: "Please wait while we save the recipe.",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // setLoadingPost(true);


            const descriptionText = description.getCurrentContent().getPlainText();
            await axios.post("http://localhost:5231/api/Recipe/addRecipe", {
                Name: name.trim(),
                Description: descriptionText,
                IsPublic: isPublic,
                IsApproved: true,
                IdAccountPost: admin.idAccount,
                ContestId: id
            })

            const response = await axios.get(`http://localhost:5231/api/Recipe/detailByName/${name.trim()}`)
            const idRecipe = response.data.recipe.idRecipe

            await axios.put(`http://localhost:5231/api/Recipe/updateRecipeIngredients/${idRecipe}`, {
                ingredients: selectedIngredients.map(item => ({
                    ingredientID: item.idIngredient,
                    quantity: item.quantity
                }))
            });

            Swal.fire({ icon: 'success', title: 'Recipe updated successfully!', timer: 1500 })
                .then(() => navigate(`/contest/${id}`));

        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed to update recipe', text: 'Please try again later.' });
        } finally {
            // setLoadingPost(false);
        }
    };

    const handleIngredientSelect = (ingredientName) => {
        const ingredient = ingredientList.find(item => item.name === ingredientName);
        if (ingredient && !selectedIngredients.some(item => item.name === ingredientName)) {
            setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 0 }]);
        }
    };

    // if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div style={{ maxHeight: "100vh", marginTop: "10px" }}>
            <div style={{
                textAlign: "center", display: "flex", alignItems: "center",
                justifyContent: "space-between", flexDirection: "row", height: "30px",
                width: "100%"
            }}>
                <div style={{ textAlign: "center", width: "97%" }}>
                    <h2>Create New Recipe</h2>
                </div>
                <button style={{
                    height: "20px", width: "3%", cursor: "pointer",
                    background: "none", border: "none", fontSize: "15px", paddingRight: "50px"
                }}
                    onClick={() =>
                        navigate(`/contest/${id}`)
                    }>Back</button>
            </div>
            <div style={{
                width: "100vw", height: "100vh", display: "flex", padding: "20px", boxSizing: "border-box",
                background: "linear-gradient(to top, rgba(255, 126, 95, 0.5), #ffffff)"
            }}>
                <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label >Name:</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            style={{ width: "97%", padding: "8px", backgroundColor: "transparent" }} />
                        {errors.name && <span style={{ color: "red" }}>{errors.name}</span>}
                        <br /><br />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label>Status:</label>
                        <select value={isPublic ? "true" : "false"} onChange={(e) => setIsPublic(e.target.value === "true")}
                            style={{ width: "100%", padding: "8px", backgroundColor: "transparent" }}>
                            <option value="true">Public</option>
                            <option value="false">Private</option>
                        </select>
                        <br /><br />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <label>Cooking Procedure: {errors.description && <span style={{ color: "red" }}>{errors.description}</span>}
                        </label>
                        <div style={{
                            border: "1px solid #ddd", height: "300px", padding: "10px",
                            backgroundColor: "rgba(255, 255, 255, 0.2)"
                        }} onClick={() => editorRef.current.focus()}>
                            <Editor ref={editorRef} editorState={description} onChange={setDescription} />
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, marginTop: "23px" }}>
                    <label>Ingredients:</label>
                    <div style={{ marginBottom: "10px" }}>
                        <select
                            onChange={(e) => handleIngredientSelect(e.target.value)}
                            style={{ width: "100%", padding: "8px", backgroundColor: "transparent", marginTop: "10px" }}
                        >
                            <option value="">Select an ingredient</option>
                            {ingredientList.map((ingredient, index) => (
                                <option key={index} value={ingredient.name}>{ingredient.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedIngredients.length > 0 && (
                        <div className="ingredient-card-wrapper">
                            {console.log(selectedIngredients)}
                            {selectedIngredients.map((ingredient, index) => {
                                return (
                                    <IngredientCard
                                        key={index}
                                        name={ingredient?.name || "UNKNOWN"}
                                        handleIngredientRemove={handleIngredientRemove}
                                    />
                                );
                            })}
                        </div>
                    )}


                    {selectedIngredients.length > 0 && (
                        <div style={{ maxHeight: "355px", overflowY: "auto", border: "1px solid #ccc", marginTop: "10px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f4f4f4" }}>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", width: "70%" }}>Ingredient</th>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", width: "20%" }}>Quantity</th>
                                        <th style={{ padding: "10px", border: "1px solid #ddd", width: "10%" }}>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedIngredients.map((ingredientName, index) => {
                                        const ingredient = ingredientList.find(item => item.name === ingredientName.name);
                                        return (
                                            <tr key={index}>
                                                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{ingredientName.name}</td>
                                                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                                                    <input type="number" min={0}
                                                        className="add-ingredient-table"
                                                        defaultValue={ingredientName.quantity}
                                                        onChange={(e) => {
                                                            const value = Math.max(0, e.target.value);
                                                            setSelectedIngredients(selectedIngredients.map(item =>
                                                                item.name === ingredient.name ? { ...item, quantity: value } : item
                                                            ));
                                                        }}
                                                        style={{ width: "50%", textAlign: "center" }} />
                                                </td>
                                                <td style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>
                                                    {ingredient ? ingredient.unit.trim() : "Unit not found"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                            </table>
                        </div>
                    )}

                    <div>
                        <button onClick={handleSave} className="add-recipe-submit-button" style={{
                            width: "100%", border: "none", backgroundColor: "#ff7700", height: "30px"
                        }}>Apply Entry</button>
                        {loadingPost && <p style={{ color: "blue" }}>Saving contest, please wait...</p>}
                    </div>
                </div>
            </div>
        </div >
    );
}

export default ApplyEntry;
