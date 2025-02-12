import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import "../../css/tip/tip-detail.css";
import axios from "axios";
import NotFoundPage from '../notFoundPage.js';
import { DataContext } from "../../context/DatabaseContext";
import PaymentForm from '../account/payment-form';
import Swal from 'sweetalert2';

function TipDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { tokenInfor } = useContext(DataContext);

    const [tip, setTip] = useState(null);
    const [user, setUser] = useState(null);
    const [payment, setPayment] = useState(false);

    useEffect(() => {
        if (id) fetchTip();
        else console.error("Invalid tip ID.");
    }, [id]);

    useEffect(() => {
        if (tokenInfor?.email) fetchUser();
        else navigate("/login", { state: { from: location.pathname } }); // Chặn người chưa đăng nhập
    }, [tokenInfor]);

    const fetchTip = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Tips/getSpecificTip?idTip=${id}`);
            setTip(response.data);
        } catch (err) {
            console.log("Tip not found");
            setTip(null);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
            setUser(response.data);
        } catch (error) {
            console.log(error);
            navigate("/login", { state: { from: location.pathname } }); // Chặn người chưa đăng nhập
        }
    };

    const handleSetPayment = () => {
        setPayment(true)
    }

    if (!tip) return <NotFoundPage />;

    const isPublic = tip?.isPublic;
    const isMember = user?.status;
    const userRole = user?.role;
    // Nếu nội dung riêng tư và người dùng không phải thành viên -> Chặn hiển thị
    if (!isPublic && userRole === "USER" && !isMember) {
        return (
            <div className="contestdt-container center-text" style={{ marginTop: "60px" }}>
                <p>
                    This page is for members only. You need to register to view the content. <br />
                    Click <span style={{ color: "orange", cursor: "pointer" }} onClick={() => handleSetPayment()}>here</span> to register.
                </p>
                {payment && (
                    <div className="payment-overlay">
                        <div className="payment-box">
                            <button className="close-button" onClick={() => setPayment(false)}>✖</button>
                            <h4 className="payment-message">Your account is not active. Please subscribe to access this content.</h4>
                            <PaymentForm user={user} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="tip-detail-container">
            <button className="back-button" style={{ color: "white", background: "#d15834", marginTop: "100px" }} onClick={() => navigate("/tips")}>
                Back
            </button>

            <div className="tip-detail-content">
                <div className="tip-detail-image-container">
                    {tip.images ? (
                        <img
                            src={`http://localhost:5231${tip.images}`}
                            alt={tip.name}
                            className="tip-detail-image"
                            onError={(e) => (e.target.src = "/images/default.jpg")}
                        />
                    ) : (
                        <div className="tip-detail-no-image">No Image Available</div>
                    )}
                </div>

                <div className="tip-detail-body">
                    <h1 className="tip-detail-title">{tip.name}</h1>
                    <div className="tip-detail-info">
                        <div className="tip-detail-description">
                            {tip.decription.split("\n").map((item, key) => <p key={key}>{item}</p>)}
                        </div>
                        <div className="tip-detail-author">Posted by: {tip.account?.name || "Unknown"}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TipDetail;