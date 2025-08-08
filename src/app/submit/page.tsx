import GameSubmissionForm from '@/components/GameSubmissionForm';

export default function SubmitPage() {
  return (
    <div className="py-8">
      <GameSubmissionForm 
        onSuccess={(gameId) => {
          console.log('游戏提交成功，ID:', gameId);
        }}
      />
    </div>
  );
}
