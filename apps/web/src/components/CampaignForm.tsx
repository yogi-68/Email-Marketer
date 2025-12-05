'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import styles from './CampaignForm.module.css';

interface CampaignFormProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
}

export default function CampaignForm({ onClose, onSubmit }: CampaignFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        from: '',
        htmlBody: '',
        textBody: '',
        useSTO: true,
        scheduledFor: '',
    });
    const [fileStats, setFileStats] = useState<{ count: number; name: string } | null>(null);
    const [parsedRecipients, setParsedRecipients] = useState<any[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setParsedRecipients([]);
            setFileStats(null);
            return;
        }

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const recipients = results.data
                    .filter((row: any) => row.email) // Ensure email exists
                    .map((row: any) => ({
                        email: row.email,
                        personalizations: { ...row } // Use all columns as personalizations
                    }));

                if (recipients.length === 0) {
                    alert('No valid recipients found. CSV must contain an "email" column.');
                    setParsedRecipients([]);
                    setFileStats(null);
                    return;
                }

                setParsedRecipients(recipients);
                setFileStats({
                    count: recipients.length,
                    name: file.name
                });
            },
            error: (error) => {
                console.error('CSV Error:', error);
                alert('Failed to parse CSV file');
                setParsedRecipients([]);
                setFileStats(null);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (parsedRecipients.length === 0) {
            alert('Please upload a CSV file with at least one recipient (must have "email" column)');
            return;
        }
        onSubmit({
            ...formData,
            recipients: parsedRecipients
        });
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2>Create New Campaign</h2>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Campaign Name */}
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Campaign Name *</label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Welcome Series - Week 1"
                            required
                        />
                    </div>

                    {/* From Email */}
                    <div className={styles.formGroup}>
                        <label htmlFor="from">From Email *</label>
                        <input
                            type="email"
                            id="from"
                            value={formData.from}
                            onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                            placeholder="noreply@yourdomain.com"
                            required
                        />
                    </div>

                    {/* Subject Line */}
                    <div className={styles.formGroup}>
                        <label htmlFor="subject">Subject Line *</label>
                        <input
                            type="text"
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Your compelling subject line"
                            required
                        />
                        <small>Tip: Use personalization variables like {'{'}name{'}'}</small>
                    </div>

                    {/* HTML Body */}
                    <div className={styles.formGroup}>
                        <label htmlFor="htmlBody">Email Content (HTML) *</label>
                        <textarea
                            id="htmlBody"
                            value={formData.htmlBody}
                            onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
                            placeholder="<h1>Hello {name}!</h1><p>Your email content here...</p>"
                            rows={8}
                            required
                        />
                    </div>

                    {/* Text Body */}
                    <div className={styles.formGroup}>
                        <label htmlFor="textBody">Plain Text Version (Optional)</label>
                        <textarea
                            id="textBody"
                            value={formData.textBody}
                            onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
                            placeholder="Plain text version for email clients that don't support HTML"
                            rows={4}
                        />
                    </div>

                    {/* Recipient Upload */}
                    <div className={styles.formGroup}>
                        <label htmlFor="csvFile">Recipients (CSV) *</label>
                        <div className={styles.fileUpload}>
                            <input
                                type="file"
                                id="csvFile"
                                accept=".csv"
                                onChange={handleFileUpload}
                                required={!fileStats}
                            />
                            {fileStats && (
                                <div className={styles.fileStats}>
                                    <span>✅ {fileStats.name}</span>
                                    <span>{fileStats.count.toLocaleString()} recipients found</span>
                                </div>
                            )}
                        </div>
                        <small>CSV must have an "email" column. Other columns available as variables.</small>
                    </div>

                    {/* Send Time Optimization */}
                    <div className={styles.formGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.useSTO}
                                onChange={(e) => setFormData({ ...formData, useSTO: e.target.checked })}
                            />
                            <span>Enable Send Time Optimization (STO)</span>
                        </label>
                        <small className={styles.stoInfo}>
                            🎯 AI will analyze engagement patterns and send each email at the optimal time for maximum opens
                        </small>
                    </div>

                    {/* Schedule For */}
                    <div className={styles.formGroup}>
                        <label htmlFor="scheduledFor">Schedule For (Optional)</label>
                        <input
                            type="datetime-local"
                            id="scheduledFor"
                            value={formData.scheduledFor}
                            onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                        />
                        <small>Leave empty to send immediately</small>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={parsedRecipients.length === 0}>
                            Create Campaign ({fileStats ? fileStats.count : 0} recipients)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
