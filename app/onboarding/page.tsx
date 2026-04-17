import { submitOnboarding } from "../action";
import OnboardingForm from "./onbordingForm";

export default function OnboardingPage() {
  return (
    <OnboardingForm action={submitOnboarding} />
  );
}