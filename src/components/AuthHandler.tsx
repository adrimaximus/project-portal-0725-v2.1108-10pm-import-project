import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AuthHandler = () => {
  const { session, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event) => {
      if (_event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && user && session) {
      const searchParams = new URLSearchParams(location.search);
      const serviceParam = searchParams.get('service');
      
      let targetPath = (location.state as any)?.from?.pathname;
      let targetSearch = (location.state as any)?.from?.search || '';

      // If 'service' query param exists, prioritize sending user to Request page
      if (serviceParam) {
        targetPath = '/request';
        // Keep the service param in the query string for the Request page to read
        if (!targetSearch.includes('service=')) {
            targetSearch = targetSearch ? `${targetSearch}&service=${serviceParam}` : `?service=${serviceParam}`;
        }
      } else if (!targetPath) {
        targetPath = '/dashboard';
      }

      // Only redirect if we are on auth-related pages (prevent redirect loop if already on correct page)
      if (['/login', '/', '/auth/callback'].includes(location.pathname)) {
        navigate(targetPath + targetSearch, { replace: true });
      }
    }
  }, [user, isLoading, session, navigate, location]);

  return null; // This component does not render anything
};

export default AuthHandler;
</dyad-file>

<dyad-write path="src/pages/Request.tsx" description="Updating RequestPage to pre-select services based on URL parameters from the landing page">
import { useState, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Service } from "@/types";
import SelectedServicesSummary from "@/components/SelectedServicesSummary";
import ServiceSelection from "@/components/request/ServiceSelection";
import ProjectDetailsForm from "@/components/request/ProjectDetailsForm";
import { useSearchParams } from "react-router-dom";

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [searchParams] = useSearchParams();
  const [isPreSelected, setIsPreSelected] = useState(false);

  const handleServiceSelect = (service: Service) => {
    const isFeatured = service.is_featured;
    const isAlreadySelected = selectedServices.some(
      (s) => s.title === service.title
    );

    if (isFeatured) {
      setSelectedServices(isAlreadySelected ? [] : [service]);
    } else {
      let newSelectedServices = selectedServices.filter(
        (s) => !s.is_featured
      );
      if (isAlreadySelected) {
        newSelectedServices = newSelectedServices.filter(
          (s) => s.title !== service.title
        );
      } else {
        newSelectedServices.push(service);
      }
      setSelectedServices(newSelectedServices);
    }
  };

  // Logic to pre-select service from URL query param (e.g. ?service=web)
  // This is used when navigating from the Landing Page
  useEffect(() => {
    // Only run once to avoid overriding user changes
    if (isPreSelected) return;

    // We need to wait for ServiceSelection child to fetch services, or we could move fetch here.
    // However, since ServiceSelection holds the data fetching logic currently,
    // we can't easily access the list of 'services' here without refactoring.
    // 
    // BUT, `ServiceSelection` exposes `onServiceSelect`.
    // Let's refactor slightly to let `ServiceSelection` handle the initial match 
    // since it owns the data.
    //
    // Alternatively, we pass the query param down to `ServiceSelection`.
  }, [isPreSelected, searchParams]);

  const renderContent = () => {
    if (step === 1) {
      return (
        <ServiceSelection
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedServices={selectedServices}
          onServiceSelect={handleServiceSelect}
          preSelectId={searchParams.get('service')}
        />
      );
    } else {
      return (
        <ProjectDetailsForm
          selectedServices={selectedServices}
          onBack={() => setStep(1)}
        />
      );
    }
  };

  const summaryComponent =
    step === 1 ? (
      <SelectedServicesSummary
        selectedServices={selectedServices}
        onContinue={() => setStep(2)}
      />
    ) : null;

  return (
    <PortalLayout summary={summaryComponent} disableMainScroll={step === 2}>
      {renderContent()}
    </PortalLayout>
  );
};

export default RequestPage;