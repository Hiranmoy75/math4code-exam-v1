import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

// cache() is needed to ensure we don't create a new QueryClient
// for every component in the same request tree.
export const getQueryClient = cache(() => new QueryClient());
