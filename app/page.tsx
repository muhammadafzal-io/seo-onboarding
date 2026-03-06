import OnboardingForm from "../components/OnboardingForm"
import { submitOnboarding } from "./action"




export default async function Home() {
  return <OnboardingForm action={submitOnboarding} />
}