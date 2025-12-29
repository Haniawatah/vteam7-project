import React from 'react';

const Profile: React.FC = () => {
    return (
        <div className="profile-container">
            <h1>User Profile</h1>
            <div className="profile-details">
                <h2>Details</h2>
                {/* User details will be displayed here */}
            </div>
            <div className="profile-balance">
                <h2>Balance</h2>
                {/* User balance will be displayed here */}
            </div>
        </div>
    );
};

export default Profile;