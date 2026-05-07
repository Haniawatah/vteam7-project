import React, { useState } from 'react';

const Settings: React.FC = () => {
    const [preferences, setPreferences] = useState({
        notifications: true,
        darkMode: false,
    });

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setPreferences((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };

    const handleSave = () => {
        // Logic to save preferences
        console.log('Preferences saved:', preferences);
    };

    return (
        <div className="settings">
            <h2>User Settings</h2>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="notifications"
                        checked={preferences.notifications}
                        onChange={handleToggle}
                    />
                    Enable Notifications
                </label>
            </div>
            <div>
                <label>
                    <input
                        type="checkbox"
                        name="darkMode"
                        checked={preferences.darkMode}
                        onChange={handleToggle}
                    />
                    Enable Dark Mode
                </label>
            </div>
            <button onClick={handleSave}>Save Settings</button>
        </div>
    );
};

export default Settings;