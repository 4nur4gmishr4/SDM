import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { uploadImageFile } from '../../lib/uploadImage';
import './ImageUploadField.css';

interface PresetImage {
  label: string;
  url: string;
}

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  helpText?: string;
  presets?: PresetImage[];
  accept?: string;
  isVideo?: boolean;
}

export function ImageUploadField({
  label = 'Image',
  value,
  onChange,
  required = false,
  helpText,
  presets = [],
  accept = 'image/*',
  isVideo = false,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImageFile(file);
      onChange(uploadedUrl);
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="image-upload-field">
      <div className="image-upload-field__label-row">
        <label className="image-upload-field__label">
          {label} {required && '*'}
        </label>
        <button
          type="button"
          className="image-upload-field__toggle-url-btn"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          {showUrlInput ? 'Hide URL link' : 'Or paste URL link'}
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      {/* Uploading Spinner */}
      {isUploading ? (
        <div className="image-upload-field__uploading">
          <div className="image-upload-field__spinner" />
          <span>Uploading {isVideo ? 'video' : 'image'} to store storage...</span>
        </div>
      ) : value ? (
        /* Preview Card */
        <div className="image-upload-field__preview-card">
          <div className="image-upload-field__preview-img-box">
            {isVideo || value.endsWith('.mp4') ? (
              <video src={value} muted autoPlay loop playsInline controls={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={value} alt="Preview" className="image-upload-field__preview-img" />
            )}
          </div>

          <div className="image-upload-field__preview-info">
            <div className="image-upload-field__preview-title">
              {isVideo ? 'Selected Video' : 'Selected Image'}
            </div>
            <div className="image-upload-field__preview-url" title={value}>
              {value.startsWith('data:') ? 'Custom Uploaded File (Ready)' : value}
            </div>
          </div>

          <div className="image-upload-field__preview-actions">
            <button
              type="button"
              className="image-upload-field__action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload a different image"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
              <span>Change</span>
            </button>
            <button
              type="button"
              className="image-upload-field__action-btn image-upload-field__action-btn--delete"
              onClick={handleRemove}
              title="Remove image"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone */
        <div
          className={`image-upload-field__dropzone ${isDragging ? 'image-upload-field__dropzone--active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
        >
          <span className="material-symbols-outlined image-upload-field__dropzone-icon">
            add_photo_alternate
          </span>
          <div className="image-upload-field__dropzone-text">
            Click to upload {isVideo ? 'video/image' : 'image'}, or drag & drop file
          </div>
          <div className="image-upload-field__dropzone-hint">
            PNG, JPG, WEBP, GIF from your computer or phone
          </div>
        </div>
      )}

      {/* Paste URL Input (Optional toggle) */}
      {showUrlInput && (
        <div style={{ marginTop: '4px' }}>
          <md-outlined-text-field
            label="Image / Media URL"
            className="admin-form-field"
            value={value || ''}
            onInput={(e: any) => onChange(e.target.value)}
            placeholder="https://your-project.supabase.co/storage/v1/object/public/store-media/..."
          />
        </div>
      )}

      {/* Preset Chips */}
      {presets.length > 0 && (
        <div className="admin-preset-chips-section" style={{ marginTop: '6px' }}>
          <span className="admin-preset-chips-label">Or quick pick store photos:</span>
          <div className="admin-preset-chips">
            {presets.map((preset) => (
              <button
                key={preset.url}
                type="button"
                className="admin-preset-chip"
                onClick={() => onChange(preset.url)}
              >
                <img src={preset.url} alt="" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {helpText && (
        <span style={{ fontSize: '11.5px', color: 'var(--md-sys-color-on-surface-variant)', marginTop: '2px' }}>
          {helpText}
        </span>
      )}
    </div>
  );
}
