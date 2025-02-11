import React from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const MealItem = ({ data }) => {
    console.log(data);
    let navigate = useNavigate();
    const storedToken = JSON.parse(localStorage.getItem("inforToken"));
    const user = jwtDecode(storedToken.token)
    const userRole = user ? user.role : null;
    return (
        <>
            {
                (!data) ? "Not Found" : data.map(item => {
                    return (
                        <div className="card" key={item.idMeal} onClick={() => navigate(`/recipe/${item.idMeal}`)}>
                            <img src={item.strMealThumb} alt="" />
                            <h3>{item.strMeal}</h3>
                            {/* {console.log(user)} */}
                            {userRole === "SUPERADMIN" && (
                                <button
                                    className="edit-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/recipe-edit/${item.idMeal}`);
                                    }}
                                >
                                    Edit Recipe
                                </button>
                            )}
                        </div>
                    )
                })
            }

        </>
    )
}
export default MealItem;