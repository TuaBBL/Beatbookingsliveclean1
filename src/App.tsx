import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

// route wrappers
import PublicRoutes from './components/PublicRoutes';
import AuthenticatedRoutes from './components/AuthenticatedRoutes';

// pages / components
import HomePage from './components/HomePage';
import Login from './components/Login';
import Terms from './components/Terms';
import Dashboard from './components/Dashboard';
import CreateProfile from './components/CreateProfile';
import AuthGate from './components/AuthGate';
import AuthCallback from './components/AuthCallback';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!mounte
