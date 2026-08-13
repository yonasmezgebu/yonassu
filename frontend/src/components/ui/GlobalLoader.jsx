import React, { useState, useEffect } from 'react';

// Simple event target for API loading state — kept for backward-compatibility
export const apiLoadingEvents = new EventTarget();

// This component no longer renders a floating overlay.
// Loading state is now shown as a small inline indicator inside the search bar
// in DashboardLayout (see dash-search-icon area).
const GlobalLoader = () => null;

export default GlobalLoader;
