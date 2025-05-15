import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { useFirebase } from '../context/FirebaseContext';
import { v4 as uuidv4 } from 'uuid';
import { fetchDundamInfo } from '../utils/dundam';

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
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #1976d2;
  }
`;

const ErrorMessage = styled.p`
  color: #ff0000;
  margin: 8px 0;
`;

const GroupLink = styled.a`
  color: #2196f3;
  text-decoration: none;
  margin-top: 10px;
  display: block;
  text-align: center;

  &:hover {
    text-decoration: underline;
  }
`;

interface CharacterInfo {
  server: string;
  job: string;
  name: string;
  adventureName: string;
  level: string;
  buffScore?: string;
  damage?: string;
  setPoint: string;
  criticalRate: string;
}

export function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo[] | null>(
    null
  );
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [finalGroupName, setFinalGroupName] = useState<string | null>(null);
  const { writeData, readData } = useFirebase();
  const navigate = useNavigate();

  const findAvailableGroupName = async (baseName: string) => {
    let finalName = baseName;
    let counter = 1;
    let exists = await readData(`groupsByName/${finalName}`);

    while (exists) {
      finalName = `${baseName}#${counter}`;
      counter++;
      exists = await readData(`groupsByName/${finalName}`);
    }

    return finalName;
  };

  const handleDundamSearch = async () => {
    try {
      const info = await fetchDundamInfo(groupName);
      setCharacterInfo(info);
    } catch (err) {
      setError('캐릭터 정보를 가져오는데 실패했습니다.');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreatedGroupId(null);
    setFinalGroupName(null);

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const finalName = await findAvailableGroupName(groupName);
      const groupId = uuidv4();

      // 그룹 데이터 저장
      await writeData(`groups/${groupId}`, {
        id: groupId,
        name: finalName,
        password,
        createdAt: new Date().toISOString(),
        parties: [],
      });

      // 그룹 이름으로 검색 가능하도록 인덱스 저장
      await writeData(`groupsByName/${finalName}`, {
        groupId,
      });

      setCreatedGroupId(groupId);
      setFinalGroupName(finalName);
    } catch (err) {
      setError('그룹 생성 중 오류가 발생했습니다.');
    }
  };

  const handleGroupClick = () => {
    if (createdGroupId) {
      navigate(`/group/${createdGroupId}`);
    }
  };

  return (
    <Container>
      <h2>새 그룹 만들기</h2>
      <Form onSubmit={handleCreateGroup}>
        <Input
          type="text"
          placeholder="그룹명"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          required
        />
        <Button type="button" onClick={handleDundamSearch}>
          던담 검색
        </Button>
        {characterInfo && (
          <div>
            {characterInfo.map((char: CharacterInfo, index: number) => (
              <div key={index}>
                <p>서버: {char.server}</p>
                <p>직업: {char.job}</p>
                <p>캐릭터명: {char.name}</p>
                <p>모험단: {char.adventureName}</p>
                <p>레벨: {char.level}</p>
                {char.buffScore && <p>버프 점수: {char.buffScore}</p>}
                {char.damage && <p>데미지: {char.damage}</p>}
              </div>
            ))}
          </div>
        )}
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
        {createdGroupId && finalGroupName && (
          <GroupLink onClick={handleGroupClick} href="#">
            '{finalGroupName}' 그룹으로 이동하기
          </GroupLink>
        )}
      </Form>
    </Container>
  );
}
