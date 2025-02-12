import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import { MdFoodBank } from 'react-icons/md';
import { FaBell } from 'react-icons/fa';
import { DataContext } from "../../context/DatabaseContext";
import axios from "axios";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { tokenInfor } = useContext(DataContext);

  // Memoize fetchUser with useCallback
  const fetchUser = useCallback(async () => {
    if (!tokenInfor?.email) return; // Guard clause for when there's no email

    try {
      const response = await axios.get(`http://localhost:5231/api/Account/${tokenInfor.email}`);
      if (response) {
        setUser(response.data);
      }
    } catch (error) {
      console.log('Error fetching user:', error);
      setUser(null);
    }
  }, [tokenInfor?.email]); // Only recreate if email changes

  const handleScroll = useCallback(() => {
    const offset = window.scrollY;
    setScrolled(offset > 60);
  }, []);

  // Effect for scroll listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Separate effect for fetching user
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact-section");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <div className="brand-and-toggler">
          <Link to="/" className="navbar-brand" onClick={scrollToTop}>
            <MdFoodBank size={24} />
            <span className="navbar-brand-text">James Thew</span>
          </Link>

          <div className="nav-buttons">
            <Link to="/recipe" className="login-btn" onClick={scrollToTop}>Recipe</Link>
            <Link to="/contest" className="login-btn" onClick={scrollToTop}>Competition</Link>
            <Link to="/tips" className="login-btn" onClick={scrollToTop}>Tips</Link>
            {/* <Link to="#" className="login-btn" onClick={scrollToContact}>Contact</Link> */}
            <Link to="/helppage" className="login-btn" onClick={scrollToTop}>Help</Link>
            {user ? (
              <Link to="/management" className="login-btn" onClick={scrollToTop}>Management</Link>
            ) : (
              <Link to="/login" className="login-btn" onClick={scrollToTop}>Login</Link>
            )}

            {/* <button onClick={toggleModal} className="bell-btn">
              <FaBell size={20} />
            </button> */}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Winner Announcement</h2>
            <div className="winner-info">
              <p>Congratulations to the contest winner!</p>
            </div>
            <button onClick={toggleModal} className="close-btn">Close</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;