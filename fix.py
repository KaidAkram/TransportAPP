import os

# Fix DonutChartBento.tsx
file_path = r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\dashboard\DonutChartBento.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
new_content = content.replace('cx=\"50%\"1', 'cx=\"50%\"')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Update GlassNumberInput.tsx
glass_path = r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\ui\GlassNumberInput.tsx'
with open(glass_path, 'r', encoding='utf-8') as f:
    glass_content = f.read()

glass_content = glass_content.replace('export interface GlassNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {',
'export interface GlassNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {\n  customStep?: number;')

glass_content = glass_content.replace('({ className = \'\', suffix, error, ...props }, ref) => {',
'({ className = \'\', suffix, error, customStep, ...props }, ref) => {')

glass_content = glass_content.replace('''
    const handleIncrement = () => {
      if (inputRef.current) {
        try {
          inputRef.current.stepUp();
        } catch (e) {
          const currentValue = Number(inputRef.current.value) || 0;
          const max = props.max !== undefined ? Number(props.max) : Infinity;
          inputRef.current.value = String(Math.min(currentValue + 1, max));
        }
        // Dispatch event so react-hook-form registers the change
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    const handleDecrement = () => {
      if (inputRef.current) {
        try {
          inputRef.current.stepDown();
        } catch (e) {
          const currentValue = Number(inputRef.current.value) || 0;
          const min = props.min !== undefined ? Number(props.min) : -Infinity;
          inputRef.current.value = String(Math.max(currentValue - 1, min));
        }
        // Dispatch event so react-hook-form registers the change
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
'''.strip(), '''
    const handleIncrement = () => {
      if (inputRef.current) {
        const stepValue = customStep !== undefined ? customStep : (props.step && props.step !== 'any' ? Number(props.step) : 1);
        const currentValue = Number(inputRef.current.value) || 0;
        const max = props.max !== undefined ? Number(props.max) : Infinity;
        inputRef.current.value = String(Math.min(currentValue + stepValue, max));
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    const handleDecrement = () => {
      if (inputRef.current) {
        const stepValue = customStep !== undefined ? customStep : (props.step && props.step !== 'any' ? Number(props.step) : 1);
        const currentValue = Number(inputRef.current.value) || 0;
        const min = props.min !== undefined ? Number(props.min) : -Infinity;
        inputRef.current.value = String(Math.max(currentValue - stepValue, min));
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };
'''.strip())

with open(glass_path, 'w', encoding='utf-8') as f:
    f.write(glass_content)

# Update AddVehicleModal.tsx
veh_path = r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\modules\vehicules\AddVehicleModal.tsx'
with open(veh_path, 'r', encoding='utf-8') as f:
    veh_content = f.read()
veh_content = veh_content.replace('{...register(\"kilometrage_actuel\")}', 'customStep={1000}\n                    {...register(\"kilometrage_actuel\")}')
with open(veh_path, 'w', encoding='utf-8') as f:
    f.write(veh_content)

# Update AddInterventionModal.tsx
int_path = r'c:\Users\Akram KAID\Desktop\Entreprise_transport\frontend\src\components\modules\maintenance\AddInterventionModal.tsx'
with open(int_path, 'r', encoding='utf-8') as f:
    int_content = f.read()
int_content = int_content.replace('{...register(\"kilometrage\", { valueAsNumber: true })}', 'customStep={1000}\n                    {...register(\"kilometrage\", { valueAsNumber: true })}')
int_content = int_content.replace('{...register(\"prochain_kilo_maintenance\", { valueAsNumber: true })}', 'customStep={1000}\n                    {...register(\"prochain_kilo_maintenance\", { valueAsNumber: true })}')
with open(int_path, 'w', encoding='utf-8') as f:
    f.write(int_content)

