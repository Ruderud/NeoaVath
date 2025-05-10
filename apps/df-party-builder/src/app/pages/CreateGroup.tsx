import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import { useFirebase } from '../context/FirebaseContext';
import { v4 as uuidv4 } from 'uuid';

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
    border-color: #2196f3;
  }
`;

const Button = styled.button`
  padding: 14px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #1976d2;
  }
`;

const ErrorMessage = styled.p`
  color: #ff0000;
  text-align: center;
  margin: 8px 0;
`;

const SuccessMessage = styled.div`
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
  border-radius: 6px;
  padding: 16px;
  margin-top: 20px;
  text-align: center;
`;

const GroupCode = styled.div`
  font-family: monospace;
  font-size: 1.2em;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  user-select: all;
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

export function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const { writeData } = useFirebase();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const groupId = uuidv4();

      await writeData(`groups/${groupId}`, {
        id: groupId,
        name: groupName,
        password,
        createdAt: new Date().toISOString(),
        parties: [],
      });

      // 그룹 이름과 ID의 매핑을 저장
      await writeData(`group-names/${groupName}`, {
        id: groupId,
        createdAt: new Date().toISOString(),
      });

      setCreatedGroupId(groupId);

      // 3초 후 그룹 페이지로 이동
      setTimeout(() => {
        navigate(`/group/${groupId}`);
      }, 3000);
    } catch (err) {
      setError('그룹 생성 중 오류가 발생했습니다.');
    }
  };

  if (createdGroupId) {
    return (
      <Container>
        <Title>그룹이 생성되었습니다!</Title>
        <SuccessMessage>
          <p>그룹 코드를 저장해주세요:</p>
          <GroupCode>{createdGroupId}</GroupCode>
          <p>잠시 후 자동으로 그룹 페이지로 이동합니다...</p>
        </SuccessMessage>
        <BackLink to="/">메인으로 돌아가기</BackLink>
      </Container>
    );
  }

  return (
    <Container>
      <Title>새 그룹 만들기</Title>
      <Form onSubmit={handleCreate}>
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
        <Input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit">그룹 만들기</Button>
      </Form>
      <BackLink to="/">메인으로 돌아가기</BackLink>
    </Container>
  );
}
