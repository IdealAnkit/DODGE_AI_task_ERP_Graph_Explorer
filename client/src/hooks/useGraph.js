import { useCallback, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function useGraph() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGraph = useCallback(async (limit = 200) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/graph`, { params: { limit } });
      setGraph(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNodeDetails = useCallback(async (type, id) => {
    const { data } = await axios.get(`${API_BASE}/graph/node/${type}/${id}`);
    return data;
  }, []);

  const fetchTrace = useCallback(async (billingId) => {
    const { data } = await axios.get(`${API_BASE}/graph/trace/${billingId}`);
    return data;
  }, []);

  const fetchBrokenFlows = useCallback(async () => {
    const { data } = await axios.get(`${API_BASE}/graph/broken`);
    return data;
  }, []);

  return { graph, loading, error, fetchGraph, fetchNodeDetails, fetchTrace, fetchBrokenFlows };
}
