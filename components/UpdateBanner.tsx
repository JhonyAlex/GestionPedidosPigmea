import React, { useEffect, useState } from 'react';

interface UpdateBannerProps {
    onRefresh: () => void;
    newVersion?: string | null;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({ onRefresh, newVersion }) => {
    const [countdown, setCountdown] = useState(3);

    useEffect(() => {
        // Countdown de 3 segundos antes de refrescar automáticamente
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onRefresh(); // Refrescar automáticamente al llegar a 0
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onRefresh]);

    return (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 z-[9999] shadow-lg animate-slide-down">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <div>
                        <p className="font-semibold text-lg">
                            🎉 Nueva versión disponible{newVersion ? ` (v${newVersion})` : ''}
                        </p>
                        <p className="text-sm text-blue-100">
                            Actualizando automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
                        </p>
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md"
                >
                    Actualizar ahora
                </button>
            </div>
        </div>
    );
};

export default UpdateBanner;
