import React, { useState, useEffect, useRef, useContext } from "react";
import { Editor, EditorState, ContentState, convertFromRaw } from "draft-js";
import "draft-js/dist/Draft.css";
import axios from "axios";
import Swal from 'sweetalert2';
import { DataContext } from "../../context/DatabaseContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import IngredientCard from "../recipes/ingredient-card";
import Select from 'react-select';

function ApplyEntry() {
    const { id } = useParams();
    const [name, setName] = useState("");
    const [description, setDescription] = useState(() => EditorState.createEmpty());
    const [isPublic, setIsPublic] = useState(true);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [ingredientList, setIngredientList] = useState([]);
    const [admin, setAdmin] = useState([]);
    const { tokenInfor } = useContext(DataContext);
    const [recipeNameList, setRecipeNameList] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingPost, setLoadingPost] = useState(false);
    const navigate = useNavigate();
    const editorRef = useRef();

    useEffect(() => {
        fetchIngredientList();
        fetchCurrentAdmin();
        fetchRecipeNames();
    }, []);

    const fetchRecipeNames = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Recipe/getAllRecipeNames");
            setRecipeNameList(response.data.$values);
        } catch (err) { console.log(err); }
    };

    const fetchIngredientList = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Recipe/getAllIngredient");
            const ingredientsWithQuantity = response.data.$values.map(item => ({
                ...item,
                quantity: 0,
            }));
            setIngredientList(ingredientsWithQuantity);
        } catch (err) { console.log(err); }
    };

    const fetchCurrentAdmin = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
            setAdmin(response.data);
        } catch (error) { console.log(error); }
        finally { setLoading(false); }
    };

    const validate = () => {
        const errors = {};
        if (!name.trim()) errors.name = "Name is required.";
        if (recipeNameList.includes(name.trim())) errors.name = "This name is already taken.";
        if (!description.getCurrentContent().hasText()) errors.description = "Description is required.";
        const missingQuantities = selectedIngredients.filter(item => !item.quantity || item.quantity <= 0);
        if (missingQuantities.length > 0) {
            errors.ingredients = `Please enter a quantity for: ${missingQuantities.map(item => item.name).join(", ")}`;
        }
        return errors;
    };

    const handleIngredientRemove = (ingredient) => {
        setSelectedIngredients(selectedIngredients.filter((item) => item.name !== ingredient));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            Swal.fire({ icon: "error", title: "Validation Error", text: Object.values(validationErrors).join("\n") });
            return;
        }

        Swal.fire({
            title: "Saving...",
            text: "Please wait while we save the recipe.",
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const descriptionText = description.getCurrentContent().getPlainText();
            await axios.post("http://localhost:5231/api/Recipe/addRecipe", {
                Name: name.trim(),
                Description: descriptionText,
                IsPublic: isPublic,
                IsApproved: false,
                IdAccountPost: admin.idAccount,
                ContestId: id
            });

            const response = await axios.get(`http://localhost:5231/api/Recipe/detailByName/${name.trim()}`);
            const idRecipe = response.data.recipe.idRecipe;

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
        }
    };

    const handleIngredientSelect = (ingredientName) => {
        const ingredient = ingredientList.find(item => item.name === ingredientName);
        if (ingredient && !selectedIngredients.some(item => item.name === ingredientName)) {
            setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 0 }]);
        }
    };

    return (
        <div className="entry-container">
            <div className="entry-header">
                <h2>Create New Recipe</h2>
                <button className="entry-back-button" onClick={() => navigate(`/contest/${id}`)}>Back</button>
            </div>
            <div className="entry-content">
                <div className="entry-left-panel">
                    <label className="entry-label">Name:</label>
                    <input type="text" className="entry-input-field" value={name} onChange={(e) => setName(e.target.value)} />
                    {errors.name && <span style={{ color: "red" }}>{errors.name}</span>}
                    <br />

                    <label className="entry-label">Status:</label>
                    <select className="entry-input-field" value={isPublic ? "true" : "false"} onChange={(e) => setIsPublic(e.target.value === "true")}>
                        <option value="true">Public</option>
                        <option value="false">Private</option>
                    </select>
                    <br />

                    <label className="entry-label">Cooking Procedure:</label>
                    <div className="entry-editor-container" onClick={() => editorRef.current.focus()}>
                        <Editor ref={editorRef} editorState={description} onChange={setDescription} />
                    </div>
                </div>

                <div className="entry-right-panel">
                    <label className="entry-label">Ingredients:</label>
                    <div className="entry-ingredient-section">
                        <Select
                            className="entry-select-ingredient"
                            options={ingredientList.map(ingredient => ({
                                value: ingredient.name,
                                label: ingredient.name,
                            }))}
                            onChange={(selectedOption) => handleIngredientSelect(selectedOption.value)}
                            placeholder="Select an ingredient"
                            isSearchable={true}
                        />
                    </div>
                    <div className="ingredient-card-wrapper">
                        {selectedIngredients.length > 0 && selectedIngredients.map((ingredient, index) => (
                            <IngredientCard key={index} name={ingredient.name} handleIngredientRemove={handleIngredientRemove} />
                        ))}
                    </div>
                    {selectedIngredients.length > 0 && (
                        <div className="entry-ingredient-table-wrapper">
                            <table className="entry-ingredient-table">
                                <thead>
                                    <tr>
                                        <th>Ingredient</th>
                                        <th>Quantity</th>
                                        <th>Unit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedIngredients.map((ingredient, index) => (
                                        <tr key={index}>
                                            <td>{ingredient.name}</td>
                                            <td><input type="number" min={0} className="entry-input-field" defaultValue={ingredient.quantity} onChange={(e) => {
                                                const value = Math.max(0, e.target.value);
                                                setSelectedIngredients(selectedIngredients.map(item =>
                                                    item.name === ingredient.name ? { ...item, quantity: value } : item
                                                ));
                                            }} /></td>
                                            <td>{ingredient.unit.trim()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button className="entry-save-button" onClick={handleSave}>Apply Entry</button>
                </div>
            </div>
        </div>
    );
}

export default ApplyEntry;
