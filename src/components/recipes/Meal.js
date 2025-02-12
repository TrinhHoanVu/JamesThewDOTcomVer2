import React, { useState, useEffect } from "react";
import "./style.css";
import MealItem from "./MealItem";
import RecipeIndex from "./RecipeIndex"; // Fix typo from ReacipeIndex to RecipeIndex

const Meal = () => {
    const [search, setSearch] = useState("");
    const [show, setShow] = useState(false);
    const [item, setItem] = useState([]);
    const [url, setUrl] = useState("https://www.themealdb.com/api/json/v1/1/search.php?f=a");

    useEffect(() => {
        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                setItem(data.meals || []); // Avoid setting undefined
                setShow(data.meals ? true : false);
            })
            .catch((err) => console.error("Error fetching data:", err));
    }, [url]); // ✅ Depend only on `url`

    const searchRecipe = (evt) => {
        if (evt.key === "Enter" && search.trim()) {
            setUrl(`https://www.themealdb.com/api/json/v1/1/search.php?s=${search}`);
        }
    };

    const setIndex = (alpha) => {
        setUrl(`https://www.themealdb.com/api/json/v1/1/search.php?f=${alpha}`);
    };

    return (
        <>
            <div className="main">
                <div className="heading">
                    <h1>Search Your Food Recipe</h1>
                </div>
                <div className="searchBox">
                    <input
                        type="search"
                        className="search-bar"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={searchRecipe} 
                    />
                </div>
                <div className="container-recipe">
                    {show ? <MealItem data={item} /> : <p>No recipes found</p>}
                </div>
                <div className="indexContainer">
                    <RecipeIndex alphaIndex={setIndex} />
                </div>
            </div>
        </>
    );
};

export default Meal;
