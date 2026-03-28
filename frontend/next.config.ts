const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Игнорировать ошибки типов при сборке
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорировать ошибки линтера при сборке
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
