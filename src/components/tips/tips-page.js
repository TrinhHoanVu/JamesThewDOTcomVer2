import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "../../css/tip/tip-page.css";
import { FaTimes } from "react-icons/fa";
import { DataContext } from "../../context/DatabaseContext";
import Swal from 'sweetalert2';
import AddTip from "../tips/add-tip";

const TipsPage = () => {
    const [tips, setTips] = useState([]);
    const [total, setTotal] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const navigate = useNavigate();
    const { tokenInfor } = useContext(DataContext);
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const location = useLocation();
    const [addTipTable, setAddTipTable] = useState(false);

    useEffect(() => {
        try {
            fetchTips();
        } catch (err) { console.log(err) }

    }, [pageNumber]);

    const fetchTips = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Tips/getApprovedTips`, {
                params: { pageNumber, pageSize }
            });
            setTips(response.data.data.$values);
            setTotal(response.data.total);
            console.log(tips)
        } catch (error) {
            console.error("Error fetching tips:", error);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
            if (response) {
                setUser(response.data);
            }
        } catch (error) {
            console.log(error);
            showLoginAlert();
        }
    };

    const showLoginAlert = () => {
        Swal.fire({
            title: "You are not logged in",
            text: "You need to log in to view this content.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No"
        }).then((result) => {
            if (result.isConfirmed) {
                navigate("/login", { state: { from: location.pathname } });
            }
        });
    };

    const createOwnTip = async () => {
        try {
            await fetchUser(); // Kiểm tra đăng nhập trước khi mở modal
            if (user) {
                setAddTipTable(true);
            }
        } catch (err) {
            console.log(err);
        }
    };
    

    const handleViewDetails = (tipId) => {
        try {
            navigate(`/tips/${tipId}`);
        } catch (er) { console.log(er) }
    };

    const handleNextPage = () => {
        try {
            if ((pageNumber - 1) * pageSize + tips.length < total) {
                setPageNumber(pageNumber + 1);
            }
        } catch (er) { console.log(er) }
    };

    const handlePreviousPage = () => {
        try {
            if (pageNumber > 1) {
                setPageNumber(pageNumber - 1);
            }
        } catch (er) { console.log(er) }

    };

    const filteredTips = tips.filter((tip) =>
        tip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tip.decription && tip.decription.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleClearSearch = () => {
        setSearchQuery("")
    }

    return (
        <div className="tips-page-container">
            {/* Banner Section */}
            <div className="tips-banner">
                <img
                    src="/images/contestbanner.jpg"
                    alt="Cooking Tips Banner"
                    className="tips-banner-image"
                />
                <h1 className="tips-title">COOKING TIPS</h1>
            </div>

            {/* Controls Section */}
            <div className="tips-controls">
                <div className="tips-controls-inner">
                    <button className="create-tip-button" onClick={createOwnTip}>
                        Create Your Own Tips
                    </button>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search tips..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        {searchQuery && (
                            <FaTimes
                                className="search-clear"
                                onClick={handleClearSearch}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Tips Grid */}
            <div className="tips-grid">
                {filteredTips.length > 0 ? (
                    filteredTips.map((tip, index) => (
                        <TipCard
                            key={tip.idTip || `tip-${index}`}
                            tip={tip}
                            onViewDetails={handleViewDetails}
                        />
                    ))
                ) : (
                    <p className="no-tips-message">No Tips available.</p>
                )}
            </div>

            {/* Pagination */}
            {total > pageSize && (
                <div className="tips-pagination">
                    <button
                        className="pagination-button"
                        onClick={handlePreviousPage}
                        disabled={pageNumber === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-text">
                        Page {pageNumber} of {Math.ceil(total / pageSize)}
                    </span>
                    <button
                        className="pagination-button"
                        onClick={handleNextPage}
                        disabled={(pageNumber - 1) * pageSize + tips.length >= total}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Add Tip Modal */}
            {addTipTable && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-button" onClick={() => setAddTipTable(false)}>✖</button>
                        <h2 className="modal-title">Create Your Tip</h2>
                        <AddTip
                            onClose={() => setAddTipTable(false)}
                            IsApproved={false}
                            title="Add tip successfully! Please wait for approval!"
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

const TipCard = ({ tip }) => {
    const navigate = useNavigate();
    const maxLength = 100;

    const handleReadMore = () => {
        navigate(`/tips/${tip.idTip}`);
    };

    return (
        <div className="tip-card" onClick={handleReadMore}>
            <h3 className="tip-card-title">{tip.name}</h3>
            <p className="tip-card-description">
                {tip.decription?.length > maxLength
                    ? `${tip.decription.substring(0, maxLength)}...`
                    : tip.decription}
                {tip.decription?.length > maxLength && (
                    <span className="tip-card-readmore">
                        More Detail
                    </span>
                )}
            </p>
            <span className={`tip-status ${tip.isPublic ? 'tip-status-public' : 'tip-status-private'}`}>
                {tip.isPublic ? "Public" : "Private"}
            </span>
        </div>
    );
};

export default TipsPage;
