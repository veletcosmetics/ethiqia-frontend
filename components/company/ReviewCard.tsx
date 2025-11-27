"use client";
import React from "react";

export const ReviewCard = ({
  review,
  allowEditResponse,
  responseOverride,
  onChangeResponse,
}: any) => {
  return (
    <div className="border border-neutral-800 rounded-2xl p-4 bg-neutral-900 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-100">{review.user}</h3>
        <span className="text-yellow-500 text-sm">
          {"⭐".repeat(review.rating)}
        </span>
      </div>

      <p className="text-neutral-300 mt-2">{review.text}</p>

      {review.ticketVerified && (
        <div className="mt-2 text-xs text-emerald-400 font-medium">
          ✔ Compra verificada
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs text-neutral-400 mb-1">Respuesta de Velet:</p>

        {allowEditResponse ? (
          <textarea
            className="w-full p-2 rounded-lg bg-neutral-800 text-neutral-200 text-sm border border-neutral-700"
            value={responseOverride || ""}
            onChange={(e) => onChangeResponse(e.target.value)}
            placeholder="Escribe una respuesta..."
          />
        ) : (
          <p className="text-neutral-300 text-sm">{review.response}</p>
        )}
      </div>

      <p className="text-right text-xs text-neutral-500 mt-2">{review.date}</p>
    </div>
  );
};

