import { useState } from "react";

export default function SettingsSection() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const handleSave = () => {
    alert(`Saved: ${name}, ${contact}`);
  };

  return (
    <form className="space-y-4">
      <div>
        <label className="block">Full Name</label>
        <input
          className="border p-2 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block">Contact Number</label>
        <input
          className="border p-2 w-full"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Save
      </button>
    </form>
  );
}
