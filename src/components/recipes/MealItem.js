import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const MealItem = ({ data }) => {
    const [userRole, setUserRole] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem("inforToken");
            if (storedToken) {
                const parsedToken = JSON.parse(storedToken);
                const user = jwtDecode(parsedToken.token);
                setUserRole(user?.role || "");
            }
        } catch (error) {
            console.log("Token parsing error:", error);
            setUserRole("");
        }
    }, []); // Empty dependency array means this only runs once on mount

    const handleEditClick = (e, mealId) => {
        e.stopPropagation();
        navigate(`/recipe-edit/${mealId}`);
    };

    if (!data) {
        return <div>Not Found</div>;
    }

    return (
        <>
            {data.map(item => (
                <div 
                    className="card" 
                    key={item.idMeal} 
                    onClick={() => navigate(`/recipe/${item.idMeal}`)}
                >
                    <img 
                        src={item.strMealThumb} 
                        alt={item.strMeal} 
                    />
                    <h3>{item.strMeal}</h3>
                    
                    {userRole === "SUPERADMIN" && (
                        <button
                            className="edit-btn"
                            onClick={(e) => handleEditClick(e, item.idMeal)}
                        >
                            Edit Recipe
                        </button>
                    )}
                </div>
            ))}
        </>
    );
};

export default MealItem;