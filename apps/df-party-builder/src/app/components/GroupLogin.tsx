import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useFirebase } from '../context/FirebaseContext';

const Container = styled.div`
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 12px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #45a049;
  }
`;

const ErrorMessage = styled.p`
  color: #ff0000;
  margin: 8px 0;
`;

export function GroupLogin() {
  const [groupName, setGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { readData } = useFirebase();
  const navigate = useNavigate();

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const groupData = await readData(`groups/${groupName}`);

      if (!groupData) {
        setError('존재하지 않는 그룹입니다.');
        return;
      }

      if (groupData.password !== password) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      // 로그인 성공 시 그룹 페이지로 이동
      navigate(`/group/${groupName}`);
    } catch (err) {
      setError('그룹 참여 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      <h2>그룹 참여하기</h2>
      <Form onSubmit={handleJoinGroup}>
        <Input
          type="text"
          placeholder="그룹명"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit">참여하기</Button>
      </Form>
    </Container>
  );
}
