// src/app/components/social/MailchimpTabContent.js

'use client';

import { useState, useEffect } from 'react';


const MailchimpTabContent = () => {
    const [audiences, setAudiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAudiences = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/mailchimp/audiences');
                if (!response.ok) {
                    throw new Error('Failed to fetch audiences from server.');
                }
                const data = await response.json();
                setAudiences(data);
            } catch (err) {
                console.error("Failed to fetch Mailchimp audiences:", err);
                setError("Could not load your Mailchimp audiences. Please ensure you are connected in Settings and try refreshing the page.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAudiences();
    }, []);

    if (isLoading) {
        return <p className="text-gray-500">Loading your Mailchimp audiences...</p>;
    }
    if (error) {
        return <p className="text-red-600 font-medium">{error}</p>;
    }
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-900">Your Mailchimp Audiences</h3>
            {audiences.length > 0 ? (
                <div className="mt-4 bg-white p-4 rounded-lg shadow">
                    <ul className="divide-y divide-gray-200">
                        {audiences.map(audience => (
                            <li key={audience.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-md font-medium text-gray-800">{audience.name}</p>
                                    <span className="text-sm text-gray-500">{audience.stats.member_count} members</span>
                                </div>
                                <button className="ml-4 px-3 py-1 text-sm bg-blue-600 text-white border border-transparent rounded-md hover:bg-blue-700">
                                    View Campaigns
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="mt-4 text-gray-500">No Mailchimp audiences found.</p>
            )}
        </div>
    );
};


export default MailchimpTabContent;