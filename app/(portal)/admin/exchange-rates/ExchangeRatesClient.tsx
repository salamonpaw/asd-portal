"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { addExchangeRate } from "@/lib/actions/warehouse-pricing";

interface Rate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: Decimal;
  effectiveDate: Date;
  partner?: { id: string; name: string } | null;
}

interface Decimal {
  toString(): string;
}

export function ExchangeRatesClient({ initialRates }: { initialRates: Rate[] }) {
  const [rates, setRates] = useState(initialRates);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    fromCurrency: "PLN",
    toCurrency: "EUR",
    rate: 0.24,
    effectiveDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.rate <= 0) {
      setError("Kurs musi być większy od 0");
      return;
    }

    setLoading(true);
    const result = await addExchangeRate(
      formData.fromCurrency,
      formData.toCurrency,
      formData.rate,
      new Date(formData.effectiveDate)
    );

    if (result.success) {
      setSuccess("Kurs dodany!");
      setFormData({
        fromCurrency: "PLN",
        toCurrency: "EUR",
        rate: 0.24,
        effectiveDate: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
      setTimeout(() => setSuccess(""), 3000);
      // Refresh page
      window.location.reload();
    } else {
      setError(result.error || "Błąd");
    }

    setLoading(false);
  };

  return (
    <div>
      {error && (
        <div
          style={{
            padding: 12,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: "var(--r-sm)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 12,
            background: "var(--success-soft)",
            color: "var(--success)",
            borderRadius: "var(--r-sm)",
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          ✓ {success}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 16px",
            background: "var(--brand)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <Icon name="plus" size={16} />
          Dodaj kurs
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            Nowy kurs wymiany
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Z waluty
              </label>
              <select
                value={formData.fromCurrency}
                onChange={(e) => setFormData({ ...formData, fromCurrency: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Na walutę
              </label>
              <select
                value={formData.toCurrency}
                onChange={(e) => setFormData({ ...formData, toCurrency: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              >
                <option value="PLN">PLN</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Kurs
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                placeholder="0.24"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                Data ważności
              </label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid var(--ink-2)",
                  borderRadius: "var(--r-sm)",
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 16px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Dodawanie..." : "Dodaj kurs"}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                padding: "8px 16px",
                background: "var(--ink-2)",
                color: "white",
                border: "none",
                borderRadius: "var(--r-sm)",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      )}

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Historia kursów ({rates.length})
        </h2>

        {rates.length > 0 ? (
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--ink-2)",
              borderRadius: "var(--r)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "100px 100px 100px 100px 150px auto",
                gap: 16,
                padding: 16,
                background: "var(--ink-1)",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <div>Z</div>
              <div>Na</div>
              <div>Kurs</div>
              <div>Data</div>
              <div>Partner</div>
              <div></div>
            </div>

            {rates.map((rate) => (
              <div
                key={rate.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "100px 100px 100px 100px 150px auto",
                  gap: 16,
                  padding: 16,
                  borderBottom: "1px solid var(--ink-2)",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 600 }}>{rate.fromCurrency}</div>
                <div>{rate.toCurrency}</div>
                <div style={{ fontWeight: 600, color: "var(--brand)" }}>
                  {parseFloat(rate.rate.toString()).toFixed(4)}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {new Date(rate.effectiveDate).toLocaleDateString("pl")}
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  {rate.partner?.name || "Globalnie"}
                </div>
                <div></div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              background: "var(--surface-2)",
              borderRadius: "var(--r)",
              color: "var(--ink-3)",
            }}
          >
            <p>Brak kursów</p>
          </div>
        )}
      </div>
    </div>
  );
}
