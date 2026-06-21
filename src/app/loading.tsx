export default function Loading () {
  return (
    <div className='min-h-screen bg-surface-base flex items-center justify-center p-8'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-10 h-10 rounded-full border-2 border-border-default border-t-accent animate-spin' />
        <p className='text-sm text-muted-foreground'>Cargando...</p>
      </div>
    </div>
  );
}
