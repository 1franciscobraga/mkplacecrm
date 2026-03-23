import { useState } from "react";

interface CompanyLogoProps {
  logoUrl: string | null | undefined;
  companyName: string;
  size?: number;
  className?: string;
}

/**
 * Displays a company logo with fallback to initials.
 * If logoUrl is provided, uses it directly.
 * Falls back to a styled initials avatar.
 */
const CompanyLogo = ({ logoUrl, companyName, size = 40, className = "" }: CompanyLogoProps) => {
  const [imgError, setImgError] = useState(false);

  const initials = companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showImage = logoUrl && !imgError;

  // If no valid logo URL, render nothing (no placeholder/initials)
  if (!showImage) {
    return null;
  }

  return (
    return (
      <div
        className={`flex-shrink-0 rounded-lg overflow-hidden bg-secondary flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt={`${companyName} logo`}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: initials
  const fontSize = size < 28 ? 9 : size < 40 ? 11 : 14;
  return (
    <div
      className={`flex-shrink-0 rounded-lg bg-secondary flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="font-semibold text-muted-foreground"
        style={{ fontSize }}
      >
        {initials}
      </span>
    </div>
  );
};

export default CompanyLogo;
