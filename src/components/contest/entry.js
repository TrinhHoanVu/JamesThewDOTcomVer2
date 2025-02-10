import React, { useState, useEffect, useRef, useContext } from "react";
import { Editor, EditorState, ContentState, convertFromRaw } from "draft-js";
import { DataContext } from "../../context/DatabaseContext";
import "draft-js/dist/Draft.css";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate, useParams } from "react-router-dom";
import IngredientCard from "../recipes/ingredient-card";
import Select from 'react-select';
import "../../css/contest/entry.css"

function Entry() {
    const { idRecipe } = useParams();
    const { id } = useParams();
    const { tokenInfor } = useContext(DataContext);

    const [name, setName] = useState("");
    const [description, setDescription] = useState(() => EditorState.createEmpty());
    const [isPublic, setIsPublic] = useState(true);
    const [initialIngredientList, setInitialIngredientList] = useState([]);
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [ingredientList, setIngredientList] = useState([]);
    const [isApproved, setIsApproved] = useState(false);
    const [idAccountPost, setIdAccountPost] = useState(null);
    const [currentUserAccount, setCurrentUserAccount] = useState(null);
    const [isFinished, setIsFinished] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [loadingPost, setLoadingPost] = useState(false);
    const [recipeNameList, setRecipeNameList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newIngredientName, setNewIngredientName] = useState("");
    const [newIngredientQuantity, setNewIngredientQuantity] = useState("");
    const [newIngredientUnit, setNewIngredientUnit] = useState("");
    const [showCustomIngredient, setShowCustomIngredient] = useState(false);
    const units = [
        { value: 'grams', label: 'grams' },
        { value: 'kilograms', label: 'kilograms' },
        { value: 'milliliters', label: 'milliliters' },
        { value: 'liters', label: 'liters' },
        { value: 'tablespoon', label: 'tablespoon' },
        { value: 'teaspoon', label: 'teaspoon' },
        { value: 'cup', label: 'cup' },
        { value: 'ounce', label: 'ounce' },
        { value: 'pound', label: 'pound' },
        { value: 'centimeter', label: 'centimeter' },
        { value: 'meter', label: 'meter' },
        { value: 'inch', label: 'inch' },
        { value: 'pint', label: 'pint' },
        { value: 'quart', label: 'quart' },
        { value: 'gallon', label: 'gallon' },
        { value: 'fluid_ounce', label: 'fluid ounce' },
        { value: 'bunch', label: 'bunch' },
        { value: 'leaf', label: 'leaf' },
        { value: 'pinch', label: 'pinch' },
        { value: 'stick', label: 'stick' }
    ];

    const navigate = useNavigate();
    const editorRef = useRef();

    useEffect(() => {
        try {
            fetchRecipe();
            fetchSpecificIngredients();
            fetchIngredientList();
            fetchCurrentAccount();
            fetchRecipeNames()
        } catch (er) { console.log(er) }
    }, []);

    useEffect(() => {
        try {
            if (currentUserAccount && idAccountPost !== null) {
                setCanEdit(currentUserAccount.idAccount === idAccountPost && !isApproved && !isFinished);
            }
        } catch (err) { console.log(err) }
    }, [currentUserAccount, idAccountPost, isApproved, isFinished]);

    const fetchCurrentAccount = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
            if (response) {
                setCurrentUserAccount(response.data);
            }
        } catch (error) {
            console.log(error);
        }
    }



    const fetchRecipe = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Recipe/detail/${idRecipe}`);
            const recipe = response.data.contest;

            setName(recipe.name);
            setIsPublic(recipe.isPublic);
            setIsApproved(recipe.isApproved)
            setIdAccountPost(recipe.idAccountPost)
            setIsFinished(recipe.contest.status === "FINISHED");

            if (recipe.description) {
                try {
                    const contentState = convertFromRaw(JSON.parse(recipe.description));
                    setDescription(EditorState.createWithContent(contentState));
                } catch (e) {
                    const contentState = ContentState.createFromText(recipe.description);
                    setDescription(EditorState.createWithContent(contentState));
                }
            }

            setLoading(false);
        } catch (err) {
            setError("Failed to load recipe details.");
            setLoading(false);
        }
    };

    const fetchSpecificIngredients = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Recipe/getIngredientsFromSpecificRecipe/${idRecipe}`);
            const formattedIngredients = response.data.$values.map(item => ({
                "$id": item.ingredient.$id,
                "idIngredient": item.ingredient.idIngredient,
                "quantity": item.quantity,
                "name": item.ingredient.name,
                "unit": item.ingredient.unit.trim(),
                "recipeIngredients": null
            }));
            setInitialIngredientList(formattedIngredients);
            setSelectedIngredients(formattedIngredients);
            setLoading(false);
        } catch (err) {
            setError("Failed to load recipe details.");
            setLoading(false);
        }
    };

    const fetchIngredientList = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Recipe/getAllApprovedIngredient");
            const ingredientsWithQuantity = response.data.$values.map(item => ({
                ...item,
                quantity: 0,
            }));
            setIngredientList(ingredientsWithQuantity);
        } catch (err) { console.log(err); }
    };

    const handleBack = () => {
        navigate(`/contest/${id}`);
    };

    const handleIngredientSelect = (ingredientName) => {
        const ingredient = ingredientList.find(item => item.name === ingredientName);
        if (ingredient && !selectedIngredients.some(item => item.name === ingredientName)) {
            setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity: 0 }]);
        }
    };

    const fetchRecipeNames = async () => {
        try {
            const response = await axios.get("http://localhost:5231/api/Recipe/getAllRecipeNames");
            setRecipeNameList(response.data.$values);
        } catch (err) { console.log(err); }
    }

    const validate = () => {
        const errors = {};
        try {
            if (name.trim() !== recipeNameList.find(recipe => recipe === name.trim())) {
                if (!name.trim()) errors.name = "Name is required.";
                if (recipeNameList.includes(name.trim())) errors.name = "This name has already been taken.";
            }
            if (!description.getCurrentContent().hasText()) errors.description = "Description is required.";
            const missingQuantities = selectedIngredients.filter(item => !item.quantity || item.quantity <= 0);
            if (missingQuantities.length > 0) {
                errors.ingredients = `Please enter a quantity for: ${missingQuantities.map(item => item.name).join(", ")}`;
            }
        } catch (err) { console.log(err); }
        return errors;
    };

    const handleIngredientRemove = (ingredient) => {
        setSelectedIngredients(selectedIngredients.filter((item) => item.name !== ingredient));
    };

    const handleAddNewIngredient = () => {
        if (!newIngredientName.trim() || !newIngredientQuantity || newIngredientQuantity <= 0 || !newIngredientUnit.trim()) {
            Swal.fire({ icon: "warning", title: "Invalid input", text: "Please enter a valid ingredient name, quantity, and unit." });
            return;
        }

        const existingIngredient = selectedIngredients.find(item => item.name.toLowerCase() === newIngredientName.toLowerCase());

        if (existingIngredient) {
            setSelectedIngredients(selectedIngredients.map(item =>
                item.name.toLowerCase() === newIngredientName.toLowerCase()
                    ? { ...item, quantity: parseFloat(item.quantity) + parseFloat(newIngredientQuantity) }
                    : item
            ));
        } else {

            const newIngredient = {
                name: newIngredientName.trim(),
                quantity: parseFloat(newIngredientQuantity),
                unit: newIngredientUnit.trim(),
            };

            setSelectedIngredients([...selectedIngredients, newIngredient]);
        }

        setNewIngredientName("");
        setNewIngredientQuantity("");
        setNewIngredientUnit("");
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

            setLoadingPost(true);

            const descriptionText = description.getCurrentContent().getPlainText();
            await axios.put(`http://localhost:5231/api/Recipe/updateRecipe/${idRecipe}`, {
                name,
                description: descriptionText,
                isApproved: false
            });

            await axios.put(`http://localhost:5231/api/Recipe/updateRecipeIngredients/${idRecipe}`, {
                ingredients: selectedIngredients.map(item => ({
                    ingredientID: item.idIngredient,
                    quantity: item.quantity
                }))
            });

            Swal.fire({ icon: 'success', title: 'Recipe updated successfully!', timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed to update recipe', text: 'Please try again later.' });
        } finally {
            setLoadingPost(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="entry-container">
            <div className="entry-header">
                <h2>Recipe Details</h2>
                <button className="entry-back-button" onClick={handleBack}>Back</button>
            </div>
            <div className="entry-content">
                <div className="entry-left-panel">
                    <label className="entry-label">Name:</label>
                    {canEdit ? (
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            className="entry-input-field" />
                    ) : (<p>{name}</p>)}
                    <br />
                    <label className="entry-label">Cooking Procedure:</label>
                    <div className="entry-editor-container">
                        <Editor
                            ref={editorRef}
                            editorState={description}
                            readOnly={!canEdit}
                            onChange={canEdit ? setDescription : () => { }}
                        />
                    </div>
                </div>
                <div className="entry-right-panel">
                    <label className="entry-label">Ingredients:</label>
                    {canEdit && (
                        <div className="entry-ingredient-section">
                            <Select
                                className="entry-select-ingredient"
                                options={[
                                    ...ingredientList.map(ingredient => ({
                                        value: ingredient.name,
                                        label: ingredient.name,
                                    })),
                                    { value: "Other", label: "Other" },
                                ]}
                                onChange={(selectedOption) => {
                                    if (selectedOption.value === "Other") {
                                        setShowCustomIngredient(true);
                                    } else {
                                        handleIngredientSelect(selectedOption.value);
                                        setShowCustomIngredient(false);
                                    }
                                }} placeholder="Select an ingredient"
                                isSearchable={true}
                            />
                            {showCustomIngredient && <div className="entry-custom-ingredient">
                                <input
                                    type="text"
                                    placeholder="Enter ingredient name"
                                    value={newIngredientName}
                                    onChange={(e) => setNewIngredientName(e.target.value)}
                                    className="entry-input-field"
                                />
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter quantity"
                                    value={newIngredientQuantity}
                                    onChange={(e) => setNewIngredientQuantity(e.target.value)}
                                    className="entry-input-field"
                                />
                                <Select
                                    className="entry-select-unit"
                                    options={units}
                                    value={newIngredientUnit && { value: newIngredientUnit, label: newIngredientUnit }}
                                    onChange={(option) => setNewIngredientUnit(option.value)}
                                    placeholder="Select unit"
                                />
                                <button onClick={handleAddNewIngredient} className="entry-add-button">Add</button>
                            </div>}
                        </div>
                    )}
                    <br />
                    {console.log(canEdit)}
                    {canEdit && selectedIngredients.length > 0 ? (
                        <div className="ingredient-card-wrapper">
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
                    ) : ""}

                    {selectedIngredients.length > 0 && (
                        <table className="entry-ingredient-table">
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedIngredients.map((ingredient, index) => {
                                    return (
                                        <tr key={index}>
                                            <td>{ingredient.name}</td>
                                            <td>
                                                {canEdit ? (
                                                    <input type="number" min={0}
                                                        className="entry-input-field"
                                                        defaultValue={ingredient.quantity}
                                                        onChange={(e) => {
                                                            const value = Math.max(0, e.target.value);
                                                            setSelectedIngredients(selectedIngredients.map(item =>
                                                                item.name === ingredient.name ? { ...item, quantity: value } : item
                                                            ));
                                                        }} />
                                                ) : ingredient.quantity}
                                            </td>
                                            <td>{ingredient.unit}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {canEdit && (
                <button className="entry-save-button" onClick={handleSave}>Save</button>
            )}
        </div>
    );

}

export default Entry;
