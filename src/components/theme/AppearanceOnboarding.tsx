import { useEffect, useState } from "react";

import { Cato } from "@/components/brand/Cato";
import { AppearancePanel } from "@/components/theme/ThemeControls";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/lib/theme";

export function AppearanceOnboarding() {
  const { hasChosenTheme, markThemeChosen, savePrefs } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasChosenTheme) setOpen(true);
  }, [hasChosenTheme]);

  async function finish() {
    await savePrefs({});
    markThemeChosen();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : void finish())}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <Cato variant="padrao" size="lg" />
          <DialogTitle>Oi! Eu sou o Cato. Vamos aprender juntos?</DialogTitle>
          <DialogDescription>Escolha as cores que deixam seus estudos mais confortáveis. Você pode mudar depois.</DialogDescription>
        </DialogHeader>
        <AppearancePanel compact />
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="ghost" onClick={() => void finish()}>Pular por agora</Button>
          <Button onClick={() => void finish()}>Começar com este tema</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}