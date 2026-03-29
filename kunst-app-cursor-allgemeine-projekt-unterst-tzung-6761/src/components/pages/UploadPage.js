import React, { useEffect, useRef, useState } from "react";
import SafeImage from "../common/SafeImage";

const TITLE_MAX = 100;
const DESC_MAX = 500;
const SIMULATED_UPLOAD_DELAY_MS = 800;
const SUCCESS_MESSAGE_DISPLAY_MS = 1200;

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.06)" />
      <path
        d="M24 14v14M18 20l6-6 6 6"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 32h20"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid rgba(18,18,18,0.3)",
        borderTopColor: "#121212",
        borderRadius: "50%",
        animation: "upload-spin 0.7s linear infinite",
        verticalAlign: "middle",
        marginRight: 8,
      }}
      aria-hidden="true"
    />
  );
}

export default function UploadPage({ onBack, onPost, currentUser, draftImageUrl, onDraftImageUrlChange }) {
  const [imageUrl, setImageUrl] = useState(() => String(draftImageUrl || ""));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDropZoneHovered, setIsDropZoneHovered] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  const canPost = imageUrl.trim().length > 0 && !isUploading;

  useEffect(() => {
    setImageUrl(String(draftImageUrl || ""));
  }, [draftImageUrl]);

  useEffect(() => {
    return () => {
      if (String(imageUrl || "").startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const setDraft = (nextValue) => {
    setImageUrl(nextValue);
    onDraftImageUrlChange(nextValue);
  };

  const clearImage = (event) => {
    event.stopPropagation();
    if (String(imageUrl || "").startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
    setDraft("");
    setErrorText("");
    setSuccessMessage("");
  };

  const assignFileAsPreview = (file) => {
    if (!file) {
      return;
    }
    if (!String(file.type || "").startsWith("image/")) {
      setErrorText("Bitte nur Bilddateien hochladen.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setErrorText("");
    setSuccessMessage("");
    setDraft(objectUrl);
  };

  const submitPost = () => {
    const normalized = imageUrl.trim();
    if (!normalized) {
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(normalized);
    } catch (error) {
      setErrorText("Bitte eine gueltige URL eingeben.");
      return;
    }

    if (!["http:", "https:", "blob:", "data:"].includes(parsedUrl.protocol)) {
      setErrorText("Nur http/https oder lokale Vorschau-URLs sind erlaubt.");
      return;
    }

    setErrorText("");
    setIsUploading(true);

    setTimeout(() => {
      onPost({
        id: Date.now(),
        ownerId: currentUser.id,
        user: currentUser.displayName,
        bio: currentUser.bio,
        avatar: currentUser.avatar,
        images: [normalized],
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      });
      setIsUploading(false);
      setSuccessMessage("Erfolgreich gepostet! ✓");
      setDraft("");
      setTitle("");
      setDescription("");
      setTimeout(() => onBack(), SUCCESS_MESSAGE_DISPLAY_MS);
    }, SIMULATED_UPLOAD_DELAY_MS);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    assignFileAsPreview(file);
  };

  const dropZoneActive = isDragActive || isDropZoneHovered;

  return (
    <section className="upload-page-shell">
      <button
        type="button"
        onClick={onBack}
        className="upload-back-btn"
      >
        ← Zurück
      </button>

      <h2 className="upload-heading">Kunstwerk hochladen</h2>
      <p className="upload-subheading">Teile dein Werk mit der Community</p>

      {/* Drop Zone or Preview */}
      {imageUrl ? (
        <div className="upload-preview-wrap fade-in">
          <SafeImage
            src={imageUrl}
            alt="Vorschau"
            className="upload-preview-img"
          />
          <button
            type="button"
            className="upload-preview-remove"
            onClick={clearImage}
            aria-label="Bild entfernen"
          >
            ✕
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={() => setIsDropZoneHovered(true)}
          onMouseLeave={() => setIsDropZoneHovered(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`upload-drop-zone${dropZoneActive ? " upload-drop-zone--active" : ""}`}
        >
          <UploadIcon />
          <p className="upload-drop-title">
            {isDragActive ? "Loslassen zum Hochladen" : "Ziehe dein Kunstwerk hierher"}
          </p>
          <p className="upload-drop-sub">oder klicke zum Auswählen</p>
          <span className="upload-drop-hint">PNG, JPG, GIF, WEBP</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          assignFileAsPreview(event.target.files?.[0]);
          event.target.value = "";
        }}
        style={{ display: "none" }}
      />

      {errorText && (
        <p className="upload-error">{errorText}</p>
      )}

      {successMessage && (
        <p className="upload-success fade-in">{successMessage}</p>
      )}

      {/* Metadata fields */}
      <div className="upload-fields">
        <label className="upload-field-label">
          <span className="upload-field-name">
            Titel
            <span className="upload-field-optional">optional</span>
          </span>
          <input
            type="text"
            placeholder="Gib deinem Werk einen Titel…"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            className="upload-input"
          />
          <span className="upload-char-count">{title.length}/{TITLE_MAX}</span>
        </label>

        <label className="upload-field-label">
          <span className="upload-field-name">
            Beschreibung
            <span className="upload-field-optional">optional</span>
          </span>
          <textarea
            placeholder="Beschreibe dein Kunstwerk…"
            value={description}
            maxLength={DESC_MAX}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            className="upload-textarea"
          />
          <span className="upload-char-count">{description.length}/{DESC_MAX}</span>
        </label>
      </div>

      {/* Actions */}
      <div className="upload-actions">
        <button
          type="button"
          onClick={() => {
            setDraft("https://picsum.photos/seed/upload-demo/900/600");
            setSuccessMessage("");
          }}
          className="upload-btn-secondary"
        >
          Demo-Bild
        </button>
        <button
          type="button"
          onClick={submitPost}
          disabled={!canPost}
          className={`upload-btn-primary${!canPost ? " upload-btn-primary--disabled" : ""}`}
        >
          {isUploading && <Spinner />}
          {isUploading ? "Wird hochgeladen…" : "Posten"}
        </button>
      </div>
    </section>
  );
}
