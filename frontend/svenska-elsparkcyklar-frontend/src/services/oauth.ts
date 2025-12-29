import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Get the token from the query string
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get('token');

        console.log(token)

        if (token) {
            // Store the token in localStorage
            localStorage.setItem('token', token);
            
            // Decode the token and store the role
            const decodedToken = JSON.parse(atob(token.split('.')[1])); // Decode JWT
            console.log(decodedToken)
            localStorage.setItem('user', decodedToken.roll);

            // Här flyttas man efter inloggningen, admin är första just nu profile måste ändras
            if (decodedToken.roll === 'admin') {
                navigate('/profile');
            } else {
                navigate('/');
            }

            // Reload the page to trigger navbar state refresh
        } else {
            // Handle case if no token is found
            console.error('No token found');
        }
    }, [navigate]);
};

export default OAuthSuccess;
