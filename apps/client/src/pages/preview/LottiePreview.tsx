import Lottie from 'lottie-react';
import loadingAnimation from '../../assets/lottie/mind-map-loading.json';

export default function LottiePreview() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-[400px] h-[400px] bg-white rounded-lg shadow-lg p-8">
        <Lottie
          animationData={loadingAnimation}
          loop={true}
          className="w-full h-full"
        />
      </div>
      <div className="mt-4 text-lg text-purple-600">
        預覽 Lottie 動畫
      </div>
    </div>
  );
} 