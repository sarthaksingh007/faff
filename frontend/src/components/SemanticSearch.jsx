import React, { useState } from "react";
import { fetchSemanticSearch } from "../api";

export default function SemanticSearch({ user, onOpenConversation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetchSemanticSearch(user._id, query, 10);
      setResults(res);
    } catch (e) {
      console.error("search error", e);
      alert("search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-b">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search memories (try: homework, number, exam, link)"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={runSearch}
          className="px-3 py-2 rounded bg-indigo-600 text-white"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="mt-3 h-24 overflow-y-auto">
        {results.length === 0 && (
          <div className="text-sm text-gray-500">No results yet</div>
        )}
        <ul className="space-y-2 mt-2">
          {results.map((r) => (
            <li key={r.id} className="p-2 border rounded">
              {/* scrollable message box */}
              <div className="text-sm mb-1 max-h-24 overflow-y-auto break-words whitespace-pre-wrap pr-1">
                {r.message}
              </div>

              <div className="text-xs text-gray-500 flex justify-between">
                <div>{new Date(r.createdAt).toLocaleString()}</div>
                <div>
                  score: {r.score?.toFixed ? r.score.toFixed(3) : r.score}
                </div>
              </div>

              <div className="mt-2">
                <button
                  onClick={() => {
                    console.log("Clicked Open Conversation");
                    console.log("Message object:", r);
                    console.log("user object:", user);
                    const otherUserId =
                      r.senderId === user._id
                        ? r.receiverId
                        : r.senderId;
                    console.log("Other user ID:", otherUserId);
                    console.log("Message ID:", r.mongoId);

                    onOpenConversation(otherUserId, r.mongoId);
                  }}
                  className="text-sm text-blue-600 underline"
                >
                  Open conversation
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
