import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { useFirebase } from '../context/FirebaseContext';

const Container = styled.div`
  max-width: 400px;
  margin: 40px auto;
  padding: 20px;
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #4caf50;
  }
`;

const Button = styled.button`
  padding: 14px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #45a049;
  }
`;

const ErrorMessage = styled.p`
  color: #ff0000;
  text-align: center;
  margin: 8px 0;
`;

const BackLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #666;
  text-decoration: none;

  &:hover {
    color: #333;
  }
`;

export function Login() {
  const [groupName, setGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { readData, findGroup } = useFirebase();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const { id: groupId } = await findGroup(groupName);
      if (!groupId) {
        setError('존재하지 않는 그룹입니다.');
        return;
      }
      const groupData = await readData(`groups/${groupId}`);

      if (!groupData) {
        setError('존재하지 않는 그룹입니다.');
        return;
      }

      if (groupData.password !== password) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      navigate(`/group/${groupName}`);
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <Container>
      <Title>그룹 참여하기</Title>
      <Form onSubmit={handleLogin}>
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
      <BackLink to="/">메인으로 돌아가기</BackLink>
    </Container>
  );
}
