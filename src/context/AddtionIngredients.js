import React, { createContext, useState, useContext } from 'react';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
    const [selectedIngredients, setSelectedIngredients] = useState([]);

    const addIngredient = (ingredient) => {
        setSelectedIngredients((prev) => [...prev, ingredient]);
    };

    return (
        <DatabaseContext.Provider value={{ selectedIngredients, addIngredient }}>
            {children}
        </DatabaseContext.Provider>
    );
};

export const useDatabase = () => useContext(DatabaseContext);
