'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { fetchMe } from '@/lib/authApi';
import { fetchProfile, updateProfile, uploadProfilePicture } from '@/lib/profileApi';

const FIELDS = [
  { key: 'nickname', label: 'Nickname', placeholder: 'What should Newton call you?' },
  { key: 'parentPhoneNumber', label: 'Phone Number', placeholder: '234-123-456-7890' },
  { key: 'country', label: 'Country', placeholder: 'Nigeria' },
  { key: 'gender', label: 'Gender', placeholder: 'Female' },
  { key: 'homeAddress', label: 'Home Address', placeholder: 'Street, city' },
  { key: 'favoriteSubject', label: 'Most Favorite Subject', placeholder: 'Biology' },
  { key: 'difficultSubject', label: 'Most Difficult Subject', placeholder: 'Further Maths' },
  { key: 'futureAmbition', label: 'Future Ambition', placeholder: 'Medical Doctor' },
  { key: 'interestsHobby', label: 'Interest and Hobby', placeholder: 'Drawing, Writing' },
];

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="block text-newton-bg/45 text-xs mb-1.5">{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 rounded-xl text-sm
          bg-white border border-newton-bg/20
          text-newton-bg placeholder:text-newton-bg/30
          focus:outline-none focus:border-newton-blue-mid
        "
      />
    </label>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [pictureUrl, setPictureUrl] = useState(null);
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [isUploading, setUploading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [meRes, profileRes] = await Promise.all([fetchMe(), fetchProfile()]);
      if (cancelled) return;
      if (meRes.ok) setEmail(meRes.data.user.email || '');
      if (profileRes.ok) {
        const { fullName, email: profileEmail, schoolName, pictureUrl: url, ...rest } = profileRes.data.data;
        setPictureUrl(url);
        setFields(rest);
      }
      setLoading(false);
    }

    load().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handlePictureChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPictureUrl(URL.createObjectURL(file)); // instant local preview
    setUploading(true);
    const { ok, data } = await uploadProfilePicture(file);
    setUploading(false);
    if (ok) {
      setPictureUrl(data.data.pictureUrl);
    } else {
      setError(data.error || 'Could not upload picture — check Cloudinary is configured.');
    }
  }

  function updateField(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { ok, data } = await updateProfile(fields);
    setSaving(false);
    if (ok) {
      router.push('/profile');
    } else {
      setError(data.error || 'Could not save your profile.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-white">
        <div className="w-10 h-10 rounded-full border-2 border-newton-blue-mid border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in min-h-full bg-white pb-8">
      {/* ── Dark header ──────────────────────────────────── */}
      <div className="relative bg-newton-bg px-4 md:px-8 pt-6 pb-6 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vector.png"
          alt=""
          className="absolute top-4 right-4 w-28 opacity-40 pointer-events-none"
        />
        <p className="text-newton-cyan-light text-sm font-semibold relative">Edit Your</p>
        <h1 className="text-white font-bold text-3xl relative">Profile</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 md:px-8 pt-6 space-y-5 max-w-lg">
        {/* Picture upload */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-newton-blue-mid text-xs font-medium">
            {isUploading ? 'Uploading…' : 'Tap to upload your picture'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-newton-bg/[0.06] border border-newton-bg/10 overflow-hidden flex items-center justify-center"
          >
            {pictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pictureUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-newton-bg/25 text-3xl font-bold">+</span>
            )}
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-newton-blue-mid flex items-center justify-center border-2 border-white">
              <Pencil className="w-3.5 h-3.5 text-white" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePictureChange}
            className="hidden"
          />
        </div>

        {/* Personal details */}
        <div>
          <p className="text-newton-blue-mid text-xs font-semibold mb-3">Personal Details</p>
          <div className="space-y-3">
            <label className="block">
              <span className="block text-newton-bg/45 text-xs mb-1.5">Email</span>
              <input
                type="text"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-xl text-sm bg-newton-bg/[0.04] border border-newton-bg/10 text-newton-bg/50"
              />
            </label>
            {FIELDS.slice(0, 5).map(({ key, label, placeholder }) => (
              <TextField
                key={key}
                label={label}
                value={fields[key]}
                placeholder={placeholder}
                onChange={(v) => updateField(key, v)}
              />
            ))}
          </div>
        </div>

        {/* STEM details */}
        <div>
          <p className="text-newton-blue-mid text-xs font-semibold mb-3">STEM Details</p>
          <div className="space-y-3">
            {FIELDS.slice(5).map(({ key, label, placeholder }) => (
              <TextField
                key={key}
                label={label}
                value={fields[key]}
                placeholder={placeholder}
                onChange={(v) => updateField(key, v)}
              />
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-xl bg-newton-bg text-white font-semibold text-sm disabled:opacity-60 hover:bg-newton-navy transition-colors"
        >
          {isSaving ? 'Saving…' : 'SUBMIT'}
        </button>
      </form>
    </div>
  );
}
