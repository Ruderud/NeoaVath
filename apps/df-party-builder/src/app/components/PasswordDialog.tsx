import { useState } from 'react';
import styled from '@emotion/styled';
import { useFirebase } from '../context/FirebaseContext';
import { useGroupAuth } from '../context/GroupAuthContext';

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DialogContent = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;

const ErrorText = styled.p`
  color: red;
  margin: 8px 0;
  text-align: center;
`;

interface PasswordDialogProps {
  groupName: string | undefined;
  onSuccess: (groupId: string) => void;
  onFailure: () => void;
}

export function PasswordDialog({
  groupName,
  onSuccess,
  onFailure,
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { readData, findGroup } = useFirebase();
  const { addAuthenticatedGroup } = useGroupAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!groupName) {
        setError('그룹 이름이 없습니다.');
        onFailure();
        return;
      }

      const { id: groupId } = await findGroup(groupName);
      const groupData = await readData(`groups/${groupId}`);

      if (!groupData) {
        setError('그룹을 찾을 수 없습니다.');
        onFailure();
        return;
      }

      if (groupData.password !== password) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      addAuthenticatedGroup(groupId);
      onSuccess(groupId);
    } catch (err) {
      console.error(err);
      setError('오류가 발생했습니다.');
      onFailure();
    }
  };

  return (
    <DialogOverlay>
      <DialogContent>
        <h2>비밀번호 확인</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="password"
            placeholder="그룹 비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit">확인</Button>
        </form>
      </DialogContent>
    </DialogOverlay>
  );
}
