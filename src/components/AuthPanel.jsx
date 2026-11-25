'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import Logo from '@/components/Logo';

export default function AuthPanel({ initialMode = 'login', nextPath = '' }) {
  const [mode, setMode] = useState(initialMode);
  const [direction, setDirection] = useState('none');

  function switchTo(nextMode) {
    if (nextMode === mode) {
      return;
    }

    if (nextMode === 'register') {
      setDirection('right');
    } else {
      setDirection('left');
    }

    setMode(nextMode);

    let url = '/login';
    if (nextMode === 'register') {
      url = '/register';
    }

    if (nextMode === 'login' && nextPath) {
      url += `?next=${encodeURIComponent(nextPath)}`;
    }
    window.history.pushState(null, '', url);
  }

  function handleSelectLogin() {
    switchTo('login');
  }

  function handleSelectRegister() {
    switchTo('register');
  }

  let animationClass = '';
  if (direction === 'right') {
    animationClass = 'animate-slide-from-right';
  } else if (direction === 'left') {
    animationClass = 'animate-slide-from-left';
  }

  const isLogin = mode === 'login';

  let headingText = 'Create Account';
  let indicatorClass =
    'absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-full';
  let signInBtnClass =
    'relative z-10 py-2.5 text-sm font-medium text-center rounded-full transition-colors duration-300 cursor-pointer text-neutral-500 hover:text-neutral-800';
  let signUpBtnClass =
    'relative z-10 py-2.5 text-sm font-medium text-center rounded-full transition-colors duration-300 cursor-pointer text-neutral-900';
  let activeForm = <RegisterForm onSwitch={handleSelectLogin} />;

  if (isLogin) {
    headingText = 'Hello!';
    indicatorClass =
      'absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-full bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0';
    signInBtnClass =
      'relative z-10 py-2.5 text-sm font-medium text-center rounded-full transition-colors duration-300 cursor-pointer text-neutral-900';
    signUpBtnClass =
      'relative z-10 py-2.5 text-sm font-medium text-center rounded-full transition-colors duration-300 cursor-pointer text-neutral-500 hover:text-neutral-800';
    activeForm = <LoginForm nextPath={nextPath} onSwitch={handleSelectRegister} />;
  }

  return (
    <div className="min-h-screen bg-(--abumuda) flex flex-col items-center justify-center gap-8 p-6 md:p-10">
      {/* navbar disembunyikan di halaman ini, jadi logo dipakai buat balik ke home */}
      <Logo href="/" />

      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-sm border border-neutral-100 p-8 md:p-10 animate-pop-in transition-shadow duration-300 hover:shadow-lg">
        <h1 key={`title-${mode}`} className={`text-3xl font-semibold text-center text-neutral-900 mb-6 ${animationClass}`}>
          {headingText}
        </h1>

        <div className="relative grid grid-cols-2 bg-(--abutab) p-1.5 rounded-full mb-7">
          <span aria-hidden="true" className={indicatorClass} />
          <button
            type="button"
            onClick={handleSelectLogin}
            aria-pressed={isLogin}
            className={signInBtnClass}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleSelectRegister}
            aria-pressed={!isLogin}
            className={signUpBtnClass}
          >
            Sign Up
          </button>
        </div>

        <div key={mode} className={animationClass}>
          {activeForm}
        </div>
      </div>
    </div>
  );
}