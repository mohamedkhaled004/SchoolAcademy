import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Play, Star, Users, Clock } from 'lucide-react';

const SLIDES = [
  {
    url: 'https://images.pexels.com/photos/4145193/pexels-photo-4145193.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Student studying with focus in a modern workspace',
    title: 'Transform Your Learning',
    subtitle: 'Access world-class education from anywhere',
  },
  {
    url: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Teacher explaining lesson in classroom',
    title: 'Learn from Experts',
    subtitle: 'Connect with industry professionals and academic leaders',
  },
  {
    url: 'https://images.pexels.com/photos/1181351/pexels-photo-1181351.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Students collaborating with laptops',
    title: 'Collaborate & Grow',
    subtitle: 'Join a global community of learners and innovators',
  },
  {
    url: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Starry night sky with space',
    title: 'Unlock Your Potential',
    subtitle: 'Discover new possibilities and achieve your dreams',
  },
  {
    url: 'https://images.pexels.com/photos/4145196/pexels-photo-4145196.jpeg?auto=compress&cs=tinysrgb&w=1200',
    alt: 'Student taking notes in class',
    title: 'Master New Skills',
    subtitle: 'Develop expertise in your chosen field',
  },
];

const autoplay = Autoplay({ delay: 5000, stopOnInteraction: true });

const HeroSlider: React.FC = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const renderDots = () => (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-3">
      {SLIDES.map((_, idx) => (
        <button
          key={idx}
          className={`w-3 h-3 rounded-full border border-white shadow-md transition-all duration-300 ${
            idx === currentIndex
              ? 'bg-white scale-110'
              : 'bg-white/30 hover:bg-white/60 hover:scale-105'
          }`}
          aria-label={`Go to slide ${idx + 1}`}
          onClick={() => emblaApi?.scrollTo(idx)}
        />
      ))}
    </div>
  );

  return (
    <div className="relative h-[600px] sm:h-[700px] md:h-[800px] w-full overflow-hidden touch-pan-y">
      {/* Carousel */}
      <div className="h-full" ref={emblaRef}>
        <div className="flex h-full">
          {SLIDES.map((slide, idx) => (
            <div className="flex-[0_0_100%] h-full relative" key={idx}>
              <img
                src={slide.url}
                alt={slide.alt}
                className="w-full h-full object-cover object-center"
                draggable={false}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6 border border-white/20">
              <Star className="h-4 w-4 mr-2" />
              Trusted by 10,000+ learners worldwide
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {SLIDES[currentIndex].title}
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                EduPlatform
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/90 mb-6 max-w-2xl mx-auto sm:mx-0 leading-relaxed">
              {SLIDES[currentIndex].subtitle}
            </p>

            {/* Features */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-white/80 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>500+ Expert Teachers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Learn at Your Pace</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>4.9/5 Rating</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/25 flex items-center justify-center"
              >
                Start Learning Free
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/login"
                className="group bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-slate-900 px-10 py-3 sm:px-15 sm:py-4 rounded-xl text-base font-semibold transition-all duration-300 flex items-center justify-center"
              >
                Sign In
                <Play className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dots Navigation */}
      {renderDots()}
    </div>
  );
};

export default HeroSlider;
