// Custom animated icons
const SuccessIcon = () => (
  <div className="relative h-4 w-4">
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle
        cx="12"
        cy="12"
        r="10"
        className="stroke-green-500 animate-[scale-pulse_2s_ease-in-out_infinite]"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M8 12.5l3 3 5-6"
        className="stroke-green-500 animate-[draw_0.5s_ease-out_forwards]"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 20,
          strokeDashoffset: 20,
          animation:
            "draw 0.5s ease-out forwards, pulse 2s ease-in-out infinite 0.5s",
        }}
      />
    </svg>
    <style>{`
      @keyframes draw {
        to { stroke-dashoffset: 0; }
      }
      @keyframes scale-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
    `}</style>
  </div>
);

const ErrorIcon = () => (
  <div className="relative h-4 w-4">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-full h-full animate-[shake_0.5s_ease-in-out]"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        className="stroke-red-500"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 8v4m0 4h.01"
        className="stroke-red-500 animate-[blink_1.5s_ease-in-out_infinite]"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
    <style>{`
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px) rotate(-5deg); }
        75% { transform: translateX(2px) rotate(5deg); }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
  </div>
);

const PendingIcon = () => (
  <div className="relative h-4 w-4">
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <circle
        cx="12"
        cy="12"
        r="10"
        className="stroke-blue-500"
        strokeWidth="2"
        fill="none"
        style={{
          strokeDasharray: 63,
          strokeDashoffset: 0,
          animation: "spin-circle 1.5s linear infinite",
        }}
      />
      <path
        d="M12 6v6l4 2"
        className="stroke-blue-400"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          transformOrigin: "12px 12px",
          animation: "rotate-hand 2s linear infinite",
        }}
      />
    </svg>
    <style>{`
      @keyframes spin-circle {
        0% { stroke-dashoffset: 63; }
        50% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -63; }
      }
      @keyframes rotate-hand {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const ProcessIcon = () => (
  <div className="relative h-4 w-4">
    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        className="fill-yellow-500 stroke-yellow-600"
        strokeWidth="1"
        style={{
          animation: "flash 1s ease-in-out infinite",
        }}
      />
    </svg>
    <style>{`
      @keyframes flash {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.95); }
      }
    `}</style>
  </div>
);

// Badge component
const Badge = ({
  variant,
  children,
  className = "",
}: {
  variant: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const baseClass =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-200";
  const variants: Record<string, string> = {
    success:
      "bg-green-100 text-green-800 hover:bg-green-200 animate-[fade-in_0.3s_ease-out]",
    destructive:
      "bg-red-100 text-red-800 hover:bg-red-200 animate-[shake-badge_0.5s_ease-out]",
    default: "bg-blue-500 text-white hover:bg-blue-600",
    secondary:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 animate-[pulse-badge_1.5s_ease-in-out_infinite]",
  };

  return (
    <span className={`${baseClass} ${variants[variant]} ${className}`}>
      {children}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake-badge {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </span>
  );
};

// Main functions
export const getStatusIcon = (status: "SUCCESS" | "ERROR" | "PENDING" | "PROCESSED") => {
  if (status === "SUCCESS") return <SuccessIcon />;
  if (status === "ERROR") return <ErrorIcon />;
  if (status === "PENDING") return <PendingIcon />;
  return <ProcessIcon />;
};

export const getStatusBadge = (
  status: "SUCCESS" | "ERROR" | "PENDING" | "PROCESSED"
) => {
  if (status === "SUCCESS") return <Badge variant="success">SUKSES</Badge>;
  if (status === "ERROR") return <Badge variant="destructive">ERROR</Badge>;
  if (status === "PENDING") return <Badge variant="default">PENDING</Badge>;
  return <Badge variant="secondary">PROSES</Badge>;
};