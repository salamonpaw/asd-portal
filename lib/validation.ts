export const ValidationRules = {
  // Required fields
  required: (value: any, fieldName: string) => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return `${fieldName} jest wymagane`;
    }
    return null;
  },

  // Quantity validation
  quantity: (value: number) => {
    if (!value || value <= 0) {
      return "Ilość musi być większa niż 0";
    }
    return null;
  },

  // Price validation
  price: (value: number, fieldName: string = "Cena") => {
    if (value < 0) {
      return `${fieldName} nie może być ujemna`;
    }
    return null;
  },

  // Selling price >= cost price
  sellingPrice: (selling: number, cost: number) => {
    if (selling < cost) {
      return "Cena sprzedaży musi być wyższa niż cena zakupu";
    }
    return null;
  },

  // Email validation
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Wpisz poprawny adres e-mail";
    }
    return null;
  },

  // Address validation
  address: (value: string) => {
    if (!value || value.trim().length < 5) {
      return "Adres musi mieć co najmniej 5 znaków";
    }
    return null;
  },

  // URL validation
  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return "Wpisz poprawny URL";
    }
  },
};

