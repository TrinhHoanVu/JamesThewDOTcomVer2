import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../css/contest/contest-page.css";
import { FaTimes } from "react-icons/fa";

const ContestPage = () => {
    const [contests, setContests] = useState([]);
    const [total, setTotal] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchContests();
    }, [pageNumber]);

    const fetchContests = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Contest/getAll`, {
                params: { pageNumber, pageSize }
            });
            setContests(response.data.data.$values);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Error fetching contests:", error);
        }
    };

    const handleViewDetails = (contestId) => {
        navigate(`/contest/${contestId}`);
    };

    const handleNextPage = () => {
        if ((pageNumber - 1) * pageSize + contests.length < total) {
            setPageNumber(pageNumber + 1);
        }
    };

    const handlePreviousPage = () => {
        if (pageNumber > 1) {
            setPageNumber(pageNumber - 1);
        }
    };

    const filteredContests = contests.filter((contest) =>
        contest.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedStatus === "" || contest.status.toLowerCase() === selectedStatus.toLowerCase())
    );

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    return (
        <div className="contestdt-container">
            <div className="contestdt-details">
                <div style={{ position: "relative" }}>
                    <img src="/images/contestbanner.jpg" alt="" className="contestdt-image" />
                    <h1 className="contest-title">Cooking Competition</h1>
                </div>


                <div className="contest-container">
                    <div style={{ width: "500px", margin: "0 auto" }}>
                        <div style={{
                            display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "500px"
                        }}>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="status-filter"
                            >
                                <option value="">All</option>
                                <option value="Not Yet">Not Yet</option>
                                <option value="Happening">Happening</option>
                                <option value="Finished">Finished</option>
                            </select>
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                                <input
                                    type="text"
                                    placeholder="Search contests..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                    style={{ width: "150px", height: "30px" }}
                                />
                                {searchQuery && <FaTimes
                                    style={{ fontSize: "25px", cursor: "pointer", borderRadius: "50%", border: "1px black" }}
                                    onClick={() => handleClearSearch()} />}
                            </div>
                        </div>
                    </div>
                    <br /><br />
                    <div className="contest-list">
                        {filteredContests.length > 0 ? (
                            filteredContests.map((contest) => (
                                <ContestCard key={contest.idContest} contest={contest} onViewDetails={handleViewDetails} />))
                        ) : (
                            <p>No Tips available.</p>
                        )}
                    </div>

                    {total > pageSize && (
                        <div className="contest-pagination">
                            <button className="contest-pagination-button" onClick={handlePreviousPage} disabled={pageNumber === 1}>
                                Previous
                            </button>
                            <span className="contest-pagination-text">
                                Page {pageNumber} of {Math.ceil(total / pageSize)}
                            </span>
                            <button
                                className="contest-pagination-button"
                                onClick={handleNextPage}
                                disabled={(pageNumber - 1) * pageSize + contests.length >= total}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ContestCard = ({ contest, onViewDetails }) => {
    try {
        const navigate = useNavigate();
        const maxLength = 100;

        const handleReadMore = () => {
            navigate(`/contest/${contest.idContest}`);
        };

        return (
            <div className="contest-card" onClick={() => handleReadMore()}>
                <h3 className="contest-card-title">{contest.name}</h3>
                <p className="contest-card-description">
                    {contest.description.length > maxLength
                        ? `${contest.description.substring(0, maxLength)}...`
                        : contest.description}
                    {contest.description.length > maxLength && (
                        <span className="contest-card-readmore" onClick={handleReadMore}>
                            More Detail
                        </span>
                    )}
                </p>
                <span className={`contest-status contest-status-${contest.status.toLowerCase()}`}>
                    {contest.status}
                </span>
            </div>
        );
    } catch (err) { console.log(err); }
};

export default ContestPage;