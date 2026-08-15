import { AlertCircle } from "lucide-react";

export function AccessDeniedCard() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-2xl shadow-sm min-h-[400px] animate-fade-in-up">
      <div className="h-16 w-16 bg-danger-bg text-danger rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">Accès Refusé</h2>
      <p className="text-text-secondary max-w-md">
        Vous n'avez pas les privilèges nécessaires pour visualiser ce module. Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
      </p>
    </div>
  );
}
