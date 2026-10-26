# Co balíček obsahuje

Předávací balíček pro hru „Řekni to s Kiki“: 60 českých slov a jejich obrázků, jednotný králíček Kiki, ikony, odměnové květiny, pozadí a návrhy hlavních obrazovek. Grafika je hotová jako upravitelné SVG, obrázky slov také jako průhledné PNG. Přehled otevřete přes REVIEW.html.

Anglické zadání je v docs/SPEC_EN.md, analýza v docs/ANALYSIS_EN.md a nový prompt pro Claude v PROMPT_EN.md. Vše je připravené k předání programátorovi nebo kódujícímu agentovi. Nejde o naprogramovanou hru: náhledy jsou statické.

Každá hra má pět slov vybraných dospělým. Dítě slyší vzor od dospělého nebo z dodané nahrávky, může zkusit slovo zopakovat a ručně pokračovat. Slova se nehodnotí automaticky. Přeskočení není trestáno. U složitějších slov rozhoduje dospělý; sada není klinickým pořadím obtížnosti.

Hlasové nahrávky nejsou součástí. Připraven je přesný scénář a cesty pro 60 souborů. První implementace proto počítá s výslovně označeným režimem, kdy slovo předříká dospělý. České nahrávky lze doplnit bez změny herní logiky.

Rozpočet 8 USD je strop pro navazující práci Claude, nikoli zaručená cena. docs/BUDGET_EN.md obsahuje výpočet a postup omezení nákladů. Pevný strop musí vynutit použitý nástroj či poskytovatel; pouhý text promptu jej nezaručí. Balíček žádné Claude API nevolá a nic nepublikuje.
