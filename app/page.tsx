'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { useGLTF, Environment, Points, PointMaterial } from '@react-three/drei';
import { Send, CheckCircle2, Menu, X } from 'lucide-react';
import * as THREE from 'three';

const THEME = {
  bgColor: '#0f2830',
  bgGradientStart: '#0f2830',
  bgGradientEnd: '#1e6d84',
  primary: '#1e6d84',
  primaryLight: '#2a8fa8',
  primaryDark: '#155a6e',
  text: '#a8d4e0',
  textHighlight: '#ffffff',
  textMuted: '#5a9aad',
  glassBg: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

function CoinParticles({ visible, position }: { visible: boolean; position: [number, number, number] }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 80;

  const particles = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 3;
      pos[i3 + 1] = (Math.random() - 0.5) * 3;
      pos[i3 + 2] = (Math.random() - 0.5) * 1;
      vel[i3] = Math.random() * 0.3 + 0.1;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.15;
      vel[i3 + 2] = (Math. random() - 0.5) * 0.1;
    }

    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (! particlesRef.current || !visible) return;

    const posAttr = particlesRef.current.geometry.attributes.position. array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      posAttr[i3] += particles.velocities[i3] * delta * 15;
      posAttr[i3 + 1] += particles.velocities[i3 + 1] * delta * 15;
      posAttr[i3 + 2] += particles.velocities[i3 + 2] * delta * 15;
    }

    particlesRef. current.geometry.attributes.position.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <Points ref={particlesRef} positions={particles.positions} position={position}>
      <PointMaterial
        transparent
        color={THEME.primaryLight}
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
      />
    </Points>
  );
}

function ModelCoin({ scrollProgress }: { scrollProgress: number }) {
  const { nodes } = useGLTF('/models/coin-shape.glb');
  const meshRef = useRef<THREE.Group>(null);
  const coinMeshRef = useRef<THREE. Mesh>(null);
  const { viewport } = useThree();
  const [showParticles, setShowParticles] = useState(false);

  const logoTexture = useLoader(THREE.TextureLoader, '/textures/logo.png');

  useEffect(() => {
    if (logoTexture) {
      logoTexture.rotation = Math.PI;
      logoTexture.center. set(0.5, 0.5);
      logoTexture.repeat.set(1 / 1.15, 1);
      logoTexture.offset.set((1 - 1 / 1.15) / 2, -0.05);
      logoTexture.wrapS = THREE. ClampToEdgeWrapping;
      logoTexture.wrapT = THREE. ClampToEdgeWrapping;
      logoTexture.flipY = false;
      logoTexture.needsUpdate = true;
    }
  }, [logoTexture]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.8;
  });

  let positionX = viewport.width / 3.5;
  let positionY = 0;
  let scale = 2.5;
  let isVisible = true;

  if (scrollProgress < 0.4) {
    positionX = viewport.width / 3.5;
    positionY = 0;
    scale = 2.5;
    isVisible = true;
    if (showParticles) setShowParticles(false);
  } else if (scrollProgress < 0.5) {
    const t = (scrollProgress - 0.4) / 0.1;
    const easeOut = 1 - Math.pow(1 - t, 4);
    positionX = viewport.width / 3.5 + viewport.width * 2 * easeOut;
    positionY = 0;
    scale = 2.5 * (1 - easeOut * 0.5);
    isVisible = t < 0.8;
    if (! showParticles && t > 0.1 && t < 0.9) setShowParticles(true);
    if (showParticles && t >= 0.9) setShowParticles(false);
  } else {
    const appearT = Math.min((scrollProgress - 0.5) / 0.05, 1);
    const easeIn = appearT * appearT;
    positionX = -viewport.width / 2.8;
    positionY = -viewport.height / 3.5;
    scale = 1.8 * easeIn;
    isVisible = true;
    if (showParticles) setShowParticles(false);
  }

  const coinMaterial = useMemo(
    () =>
      new THREE. MeshStandardMaterial({
        map: logoTexture,
        metalness: 0.6,
        roughness: 0.25,
        color: new THREE.Color('#ffffff'),
        emissive: new THREE.Color(THEME.primaryDark),
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide,
      }),
    [logoTexture]
  );

  return (
    <>
      <group ref={meshRef} position={[positionX, positionY, 0]} scale={isVisible ? scale : 0}>
        <pointLight position={[3, 3, 3]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-2, -2, 2]} intensity={1.5} color={THEME.primary} />
        <pointLight position={[0, 0, 3]} intensity={1} color={THEME. primaryLight} />

        {nodes && nodes.Scene ? (
          <primitive object={nodes.Scene. clone()} />
        ) : (
          <mesh ref={coinMeshRef} rotation={[Math.PI / 2, 0, 0]} material={coinMaterial}>
            <cylinderGeometry args={[1, 1, 0.12, 64]} />
          </mesh>
        )}
      </group>

      <CoinParticles visible={showParticles} position={[positionX - 1, positionY, 0]} />
    </>
  );
}

useGLTF.preload('/models/coin-shape.glb');

function Scene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      className="fixed inset-0 z-0 pointer-events-none"
    >
      <ambientLight intensity={0.5} />
      <Environment preset="city" />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-3, -3, 2]} intensity={0.8} color={THEME.primary} />
      <spotLight position={[0, 10, 0]} intensity={0.6} angle={0.3} penumbra={1} color={THEME.primaryLight} />

      <Suspense fallback={null}>
        <ModelCoin scrollProgress={scrollProgress} />
      </Suspense>
    </Canvas>
  );
}

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window. addEventListener('scroll', handleScroll);
    return () => window. removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Главная', link: '#hero' },
    { name: 'Услуги', link: '#services' },
    { name: 'Контакты', link: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4">
      <div
        className={`mx-4 md:mx-auto max-w-7xl transition-all duration-500 px-6 py-4 ${isScrolled ? 'backdrop-blur-md' : ''}`}
        style={{
          background: isScrolled ? 'rgba(255, 255, 255, 0. 05)' : 'transparent',
          border: isScrolled ?  `1px solid ${THEME.glassBorder}` : '1px solid transparent',
          boxShadow: isScrolled
            ? '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0. 5), inset 0 -1px 0 rgba(255, 255, 255, 0.1)'
            : 'none',
        }}
      >
        <div className="flex justify-center items-center">
          <nav className="hidden md:flex gap-12">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.link}
                className="text-xs font-bold uppercase tracking-[0.3em] transition-all duration-300 hover:text-white relative group"
                style={{ color: THEME.text }}
              >
                {item.name}
                <span
                  className="absolute -bottom-1 left-0 w-0 h-0. 5 transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: THEME.primary }}
                />
              </a>
            ))}
          </nav>

          <button
            className="md:hidden transition-colors"
            style={{ color: THEME.textHighlight }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ?  <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="absolute top-20 left-4 right-4 p-6 flex flex-col gap-6 md:hidden backdrop-blur-md"
          style={{
            background: THEME.glassBg,
            border: `1px solid ${THEME.glassBorder}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0. 1), inset 0 1px 0 rgba(255, 255, 255, 0. 5)',
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold uppercase tracking-widest transition-colors hover:text-white text-center"
              style={{ color: THEME.text }}
            >
              {item.name}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};

const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`relative overflow-hidden backdrop-blur-[5px] transition-all duration-500 group hover:scale-[1.01] ${className}`}
    style={{
      background: THEME.glassBg,
      border: `1px solid ${THEME.glassBorder}`,
      boxShadow:
        '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 255, 255, 0.1), inset 0 0 2px 1px rgba(255, 255, 255, 0.1)',
    }}
  >
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
      }}
    />

    <div
      className="absolute top-0 left-0 w-px h-full"
      style={{
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0. 8), transparent, rgba(255, 255, 255, 0.3))',
      }}
    />

    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{
        background: `linear-gradient(135deg, ${THEME.primary}15, transparent)`,
      }}
    />

    <div className="relative z-10 p-6 md:p-8">{children}</div>
  </div>
);

const SectionHero = () => {
  return (
    <section id="hero" className="min-h-screen w-full flex items-center relative snap-start pt-24 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <h1
          className="font-black tracking-tighter leading-none select-none whitespace-nowrap"
          style={{
            fontSize: 'calc(100vw / 7. 5)',
            color: 'rgba(30, 109, 132, 0.06)',
            WebkitTextStroke: '1px rgba(30, 109, 132, 0.08)',
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
          }}
        >
          DIGITAL COUNTRY
        </h1>
      </div>

      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="z-20 flex flex-col gap-8">
          <GlassCard className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight" style={{ color: THEME.textHighlight }}>
              Цифровые решения для <span style={{ color: THEME.primary }}>государственных</span> и{' '}
              <span style={{ color: THEME.primary }}>промышленных</span> предприятий
            </h2>

            <div className="space-y-4 text-base leading-relaxed" style={{ color: THEME.text }}>
              <p>
                <strong style={{ color: THEME.textHighlight }}>Digital Country</strong> — разработчик современных
                цифровых инструментов для развития предприятий, инвестиций и инфраструктуры в специальных экономических
                зонах. 
              </p>

              <p>
                Мы объединяем передовые технологии визуализации, 3D-моделирования и аналитики для ускорения развития
                промышленных комплексов и государственных проектов. 
              </p>

              <div className="pt-4 border-t border-white/10">
                <p className="text-sm uppercase tracking-widest font-bold" style={{ color: THEME.primary }}>
                  Ключевые направления:
                </p>
                <p className="text-sm mt-2">
                  3D-туры • LiDAR-сканирование • Цифровые двойники • Интерактивная аналитика
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="hidden md:block h-full min-h-[60vh]"></div>
      </div>

      <div className="absolute bottom-10 left-6 z-10 flex flex-col items-center gap-2">
        <span
          className="text-[10px] uppercase tracking-widest rotate-[-90deg] mb-4 font-bold"
          style={{ color: THEME.textMuted }}
        >
          Scroll
        </span>
        <div className="w-px h-12 animate-pulse" style={{ backgroundColor: THEME.primary }} />
      </div>
    </section>
  );
};

const SectionServices = () => {
  const services = [
    {
      title: '3D Туры',
      description:
        'Интерактивные виртуальные туры по производственным объектам и территориям СЭЗ.  Полное погружение для инвесторов и партнёров.',
    },
    {
      title: '3D Моделирование',
      description:
        'Высокоточные цифровые макеты зданий, объектов инфраструктуры и производственного оборудования для проектирования и презентаций.',
    },
    {
      title: 'LiDAR Сканирование',
      description:
        'Лазерное 3D-сканирование территорий с миллиметровой точностью.  Создание облаков точек для BIM-моделирования и геодезии.',
    },
    {
      title: 'Цифровые платформы',
      description:
        'Интерактивные каталоги, панели мониторинга, медийные экосистемы и системы визуализации данных для управления проектами.',
    },
  ];

  return (
    <section id="services" className="min-h-screen w-full flex items-center relative snap-start py-20">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="hidden md:block md:col-span-4 h-full min-h-[60vh]"></div>

          <div className="md:col-span-8 flex flex-col gap-8">
            <div className="mb-4">
              <span className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: THEME.primary }}>
                Наши решения
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mt-2 tracking-tight" style={{ color: THEME. textHighlight }}>
                Технологии для индустрии
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <GlassCard key={index}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold tracking-tight" style={{ color: THEME.textHighlight }}>
                      {service.title}
                    </h3>
                    <CheckCircle2 size={20} style={{ color: THEME.primary }} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: THEME.text }}>
                    {service.description}
                  </p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SectionContact = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    description: '',
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const { companyName, fullName, description } = formData;
    const text = `Здравствуйте, меня зовут ${fullName}.  Я представитель компании ${companyName}.  Мы хотим сделать для нашей компании: ${description}`;
    const encodedText = encodeURIComponent(text);
    window. open(`https://wa.me/77779018747?text=${encodedText}`, '_blank');
  };

  return (
    <section id="contact" className="min-h-screen w-full flex items-center justify-center relative snap-start py-20">
      <div className="container mx-auto px-6 max-w-2xl z-10">
        <GlassCard>
          <div className="mb-10">
            <span className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: THEME. primary }}>
              Связаться с нами
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 tracking-tight" style={{ color: THEME.textHighlight }}>
              Начать проект
            </h2>
            <p style={{ color: THEME.text }}>
              Заполните форму ниже.  Мы свяжемся с вами через WhatsApp для обсуждения деталей сотрудничества.
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: THEME.textMuted }}>
                Название организации
              </label>
              <input
                type="text"
                required
                className="w-full bg-transparent border-b-2 py-3 text-lg focus:outline-none transition-all"
                style={{ color: THEME. textHighlight, borderColor: THEME. glassBorder }}
                onFocus={(e) => (e.target.style.borderColor = THEME.primary)}
                onBlur={(e) => (e.target.style. borderColor = THEME.glassBorder)}
                placeholder="ТОО Промышленный комплекс"
                value={formData. companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e. target.value })}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: THEME.textMuted }}>
                Имя и Фамилия
              </label>
              <input
                type="text"
                required
                className="w-full bg-transparent border-b-2 py-3 text-lg focus:outline-none transition-all"
                style={{ color: THEME.textHighlight, borderColor: THEME.glassBorder }}
                onFocus={(e) => (e.target. style.borderColor = THEME.primary)}
                onBlur={(e) => (e.target.style.borderColor = THEME.glassBorder)}
                placeholder="Иван Иванов"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: THEME.textMuted }}>
                Опишите вашу задачу
              </label>
              <textarea
                required
                rows={4}
                className="w-full bg-transparent border-b-2 py-3 text-lg focus:outline-none transition-all resize-none"
                style={{ color: THEME.textHighlight, borderColor: THEME.glassBorder }}
                onFocus={(e) => (e.target. style.borderColor = THEME.primary)}
                onBlur={(e) => (e.target.style.borderColor = THEME.glassBorder)}
                placeholder="Например: 3D-тур производственного комплекса, LiDAR-сканирование территории завода..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target. value })}
              />
            </div>

            <button
              type="submit"
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 mt-8 px-8 py-4 hover:gap-6"
              style={{
                backgroundColor: THEME.primary,
                color: THEME.textHighlight,
                boxShadow: '0 4px 16px rgba(30, 109, 132, 0. 3)',
              }}
            >
              <span>Отправить в WhatsApp</span>
              <Send size={16} />
            </button>
          </form>
        </GlassCard>
      </div>
    </section>
  );
};

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (! mainRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(progress);
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div
      className="relative h-screen w-full overflow-hidden font-sans"
      style={{
        background: `linear-gradient(180deg, ${THEME.bgGradientStart} 0%, ${THEME.bgColor} 50%, ${THEME. bgGradientEnd}25 100%)`,
      }}
    >
      <Header />
      <Scene scrollProgress={scrollProgress} />

      <main
        ref={mainRef}
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <SectionHero />
        <SectionServices />
        <SectionContact />
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar {
          display: none;
        }
        ::selection {
          background: ${THEME.primary};
          color: white;
        }
      `}</style>
    </div>
  );
}