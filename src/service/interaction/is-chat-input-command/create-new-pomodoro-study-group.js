import schedule from 'node-schedule';

export default async (interaction) => {
  await interaction.deferReply();
  const groupName = interaction.options.getString('group-name');
  const studyTime = interaction.options.getString('study-time');

  const studyTimeArr = studyTime.split('/');

  if (!studyTimeArr.every((e) => !Number.isNaN(+e))) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: 'Study time is not valid.',
        },
      ],
      ephemeral: true,
    });
    return;
  }

  const calculatedStudyTime = studyTimeArr.reduce((pre, cur, index) => {
    pre.push((index > 0 ? pre[index - 1] : 0) + +cur);
    return pre;
  }, []);

  if (!global.pomodoro) {
    global.pomodoro = {};
  }

  const pomodoroInstance = global.pomodoro;

  const pomodoroGroup = pomodoroInstance[groupName];

  if (pomodoroGroup) {
    await interaction.editReply({
      embeds: [
        {
          color: 0x65a69e,
          description: `A group with the name \`${groupName}\` already exists.`,
        },
      ],
      ephemeral: true,
    });

    return;
  }

  // TODO: save current time, group name, and study time to the database
  /**
   * i will initialize the pomodoro instance if database exists when the bot is started
   * i thought that if database time is already passed, then the pomodoro won't be created
   */

  const finishedPomodoro = () => {
    delete pomodoroInstance[groupName];

    // TODO: remove data from the database

    console.log('finished pomodoro');
  };

  pomodoroInstance[groupName] = calculatedStudyTime.map((time, index) =>
    // schedule.scheduleJob(new Date(Date.now() + 1000 * 60 * time), () => {
    schedule.scheduleJob(new Date(Date.now() + 1000 * time), () => {
      const currentStatus = index % 2 === 0 ? 'break' : 'study';
      console.log(index + 1);
      console.log(new Date(Date.now()));
      interaction.channel.send(`**${currentStatus}** finished!`);

      // TODO: get the list of users in the group from the database

      // TODO: send a message to the group

      if (index === calculatedStudyTime.length - 1) {
        finishedPomodoro();
      }
    }),
  );

  await interaction.editReply({
    embeds: [
      {
        color: 0x65a69e,
        description: `A new pomodoro study group \`${groupName}\` has been created.`,
        // also need to show study-time
      },
    ],
  });
};
