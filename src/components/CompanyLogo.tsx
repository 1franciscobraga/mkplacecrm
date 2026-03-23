import { useState } from "react";

interface CompanyLogoProps {
  logoUrl: string | null | undefined;
  companyName: string;
  size?: number;
  className?: string;
}

const CompanyLogo = ({ logoUrl, companyName, size = 40, className = "" }: CompanyLogoProps) => {
  const [imgError, setImgError] = useState(false);

  const showImage = logoUrl && !imgError;

  if (!showImage) {
    return null;
  }

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
};

export default CompanyLogo;
